importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAfAwBXoalxdTzwohpjB-v65G-BPJjifFE",
  authDomain: "daily-bible-reading-log.firebaseapp.com",
  projectId: "daily-bible-reading-log",
  storageBucket: "daily-bible-reading-log.firebasestorage.app",
  messagingSenderId: "500677527816",
  appId: "1:500677527816:web:66b7c121c51f0f8c38c4bd",
  measurementId: "G-8JMD13G96Y"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192.png'
  });
});