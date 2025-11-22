// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "human-library-2b238.firebaseapp.com",
  projectId: "human-library-2b238",
  storageBucket: "human-library-2b238.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', // Add your icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});