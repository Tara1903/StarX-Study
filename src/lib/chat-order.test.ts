import { describe, it, expect } from 'vitest';

interface TestMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

describe('Chat Message Order & Timeline Logic', () => {
  it('correctly orders fetched messages chronologically from oldest to newest', () => {
    // Backend returns messages in descending order (newest first)
    const backendBatch: TestMessage[] = [
      { id: '3', content: "I'm good.", created_at: '2026-09-05T10:06:00Z', sender_id: 'u1' },
      { id: '2', content: 'Hello', created_at: '2026-09-05T10:02:00Z', sender_id: 'u2' },
      { id: '1', content: 'Hi', created_at: '2026-09-05T10:00:00Z', sender_id: 'u1' },
    ];

    // Reversing the descending query yields chronological order: oldest -> newest
    const chronological = [...backendBatch].reverse();

    expect(chronological[0].content).toBe('Hi');
    expect(chronological[1].content).toBe('Hello');
    expect(chronological[2].content).toBe("I'm good.");
    // Newest message is at the end (bottom of the timeline, near composer)
    expect(chronological[chronological.length - 1].content).toBe("I'm good.");
  });

  it('appends incoming realtime messages to the chronological end', () => {
    let timeline: TestMessage[] = [
      { id: '1', content: 'Message 1', created_at: '2026-09-05T10:00:00Z', sender_id: 'u1' },
      { id: '2', content: 'Message 2', created_at: '2026-09-05T10:01:00Z', sender_id: 'u2' },
      { id: '3', content: 'Message 3', created_at: '2026-09-05T10:02:00Z', sender_id: 'u1' },
    ];

    const realtimeMsg: TestMessage = {
      id: '4',
      content: 'Message 4',
      created_at: '2026-09-05T10:03:00Z',
      sender_id: 'u2',
    };

    // Correct insertion: append to end
    timeline = [...timeline, realtimeMsg];

    expect(timeline[0].content).toBe('Message 1');
    expect(timeline[timeline.length - 1].content).toBe('Message 4');
    expect(timeline.map((m) => m.id)).toEqual(['1', '2', '3', '4']);
  });

  it('prepends older paginated messages to the chronological beginning', () => {
    let timeline: TestMessage[] = [
      { id: '80', content: 'Message 80', created_at: '2026-09-05T11:20:00Z', sender_id: 'u1' },
      { id: '81', content: 'Message 81', created_at: '2026-09-05T11:21:00Z', sender_id: 'u2' },
      { id: '82', content: 'Message 82', created_at: '2026-09-05T11:22:00Z', sender_id: 'u1' },
    ];

    // Backend returns older page in descending order
    const olderBatchDesc: TestMessage[] = [
      { id: '79', content: 'Message 79', created_at: '2026-09-05T11:19:00Z', sender_id: 'u2' },
      { id: '78', content: 'Message 78', created_at: '2026-09-05T11:18:00Z', sender_id: 'u1' },
    ];

    const olderChronological = [...olderBatchDesc].reverse();
    timeline = [...olderChronological, ...timeline];

    expect(timeline.map((m) => m.id)).toEqual(['78', '79', '80', '81', '82']);
    // Newest message 82 stays at the bottom
    expect(timeline[timeline.length - 1].id).toBe('82');
    // Oldest message 78 is at the top
    expect(timeline[0].id).toBe('78');
  });

  it('correctly calculates date separator boundaries chronologically', () => {
    const messages: TestMessage[] = [
      { id: '1', content: 'Yesterday message 1', created_at: '2026-09-04T10:00:00Z', sender_id: 'u1' },
      { id: '2', content: 'Yesterday message 2', created_at: '2026-09-04T11:00:00Z', sender_id: 'u2' },
      { id: '3', content: 'Today message 1', created_at: '2026-09-05T09:00:00Z', sender_id: 'u1' },
      { id: '4', content: 'Today message 2', created_at: '2026-09-05T09:05:00Z', sender_id: 'u2' },
    ];

    const separatorIndices: number[] = [];
    for (let i = 0; i < messages.length; i++) {
      const prev = i > 0 ? messages[i - 1] : null;
      const isFirstOfDay = !prev || new Date(messages[i].created_at).toDateString() !== new Date(prev.created_at).toDateString();
      if (isFirstOfDay) separatorIndices.push(i);
    }

    // Separators should be at index 0 (September 4) and index 2 (September 5)
    expect(separatorIndices).toEqual([0, 2]);
    // The "Today" separator at index 2 is ABOVE today's messages (3 & 4) and BELOW yesterday's messages (1 & 2)
    expect(messages[separatorIndices[0]].content).toBe('Yesterday message 1');
    expect(messages[separatorIndices[1]].content).toBe('Today message 1');
  });
});
