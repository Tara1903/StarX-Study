import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'studchat — Student & Teacher Platform',
    short_name: 'studchat',
    description: 'Chat. Share. Learn. Together. — High-performance academic communication platform',
    start_url: '/chat',
    scope: '/',
    display: 'standalone',
    background_color: '#050B16',
    theme_color: '#050B16',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity', 'communication'],
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Chat Workspace',
        short_name: 'Chat',
        description: 'Open your group chats and direct messages',
        url: '/chat',
        icons: [{ src: '/icon.jpg', sizes: '192x192' }],
      },
      {
        name: 'ECE Timetable',
        short_name: 'Timetable',
        description: 'View class schedule and room details',
        url: '/timetable',
        icons: [{ src: '/icon.jpg', sizes: '192x192' }],
      },
      {
        name: 'Assignments',
        short_name: 'Assignments',
        description: 'Track and submit class assignments',
        url: '/assignments',
        icons: [{ src: '/icon.jpg', sizes: '192x192' }],
      },
    ],
  };
}
