import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StarX Study',
    short_name: 'StarX Study',
    description: 'A student communication and study platform for chatting, sharing, and learning together.',
    start_url: '/chat',
    scope: '/',
    display: 'standalone',
    background_color: '#050805',
    theme_color: '#050805',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity', 'communication'],
    icons: [
      {
        src: '/images/starx-emblem.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/starx-emblem.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Chat Workspace',
        short_name: 'Chat',
        description: 'Open your group chats and direct messages',
        url: '/chat',
        icons: [{ src: '/images/starx-emblem.png', sizes: '192x192' }],
      },
      {
        name: 'ECE Timetable',
        short_name: 'Timetable',
        description: 'View class schedule and room details',
        url: '/timetable',
        icons: [{ src: '/images/starx-emblem.png', sizes: '192x192' }],
      },
      {
        name: 'Assignments',
        short_name: 'Assignments',
        description: 'Track and submit class assignments',
        url: '/assignments',
        icons: [{ src: '/images/starx-emblem.png', sizes: '192x192' }],
      },
    ],
  };
}
