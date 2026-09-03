import { Metadata } from 'next';
import { TimetableClient } from './timetable-client';

export const metadata: Metadata = {
  title: 'ECE Time Table | studchat',
  description: 'Class Time Table for Electronics & Communication Engineering (ECE) - IET SAGE University Indore',
};

export default function TimetablePage() {
  return <TimetableClient />;
}
