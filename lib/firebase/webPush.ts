import 'firebase/messaging';
import { initializeApp } from "firebase/app";
import localforage from 'localforage';
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAA1oP8qThDsZU3m001k6RPq4CxYK08jsA",
  authDomain: "iss-project-97e11.firebaseapp.com",
  projectId: "iss-project-97e11",
  storageBucket: "iss-project-97e11.appspot.com",
  messagingSenderId: "791760337496",
  appId: "1:791760337496:web:a470b553de03647c1a282d",
  measurementId: "G-LN65R7WT16"
};

const firebaseCloudMessaging = {
  //checking whether token is available in indexed DB
  tokenInlocalforage: async () => {
    return localforage.getItem('fcm_token');
  },

  //initializing firebase app
  init: async function () {
      try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        // Initialize Firebase Cloud Messaging and get a reference to the service
        // const messaging = getMessaging(app);
        let messaging = null
        const analytics = getAnalytics(app);
        const tokenInLocalForage = await this.tokenInlocalforage();

        if(await isSupported()) {
          messaging = getMessaging(app)          
        }
        //if FCM token is already there just return the token
        if (tokenInLocalForage !== null) {
          return tokenInLocalForage;
        }

        //requesting notification permission from browser
        const status = await Notification.requestPermission();
        if (status && status === 'granted') {
          //getting token from FCM
          // getToken(messaging, { vapidKey: process.env.VAPID_KEY }).then((currentToken) => {
          //   if (currentToken) {
          //     //setting FCM token in indexed db using localforage
          //     //return the FCM token after saving it
          //     fcmToken = currentToken
          //     return currentToken;
          //     // Send the token to your server and update the UI if necessary
          //     // ...
          //   } else {
          //     // Show permission request UI
          //     console.log('No registration token available. Request permission to generate one.');
          //     // ...
          //   }
          // }).catch((err) => {
          //   console.log('An error occurred while retrieving token. ', err);
          //   // ...
          // });
          const token = getFcmToken()
          return token
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    
  },
};

const getFcmToken = () => {
// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  getToken(messaging, { vapidKey: process.env.VAPID_KEY }).then((currentToken) => {
    if (currentToken) {
      return currentToken
    } else {
      // Show permission request UI
      console.log('No registration token available. Request permission to generate one.');
      // ...
      return
    }
  }).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
    return
    // ...
  });
}

export { firebaseCloudMessaging, getFcmToken};