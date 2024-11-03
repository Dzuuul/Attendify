importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAA1oP8qThDsZU3m001k6RPq4CxYK08jsA",
    authDomain: "iss-project-97e11.firebaseapp.com",
    projectId: "iss-project-97e11",
    storageBucket: "iss-project-97e11.appspot.com",
    messagingSenderId: "791760337496",
    appId: "1:791760337496:web:a470b553de03647c1a282d",
    measurementId: "G-LN65R7WT16"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/Logo-01.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});