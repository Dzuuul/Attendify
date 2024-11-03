import type { NextApiRequest, NextApiResponse } from 'next'
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { google } from "googleapis";
import serviceAccount from '../../../lib/firebase/service-account.json'
import axios from 'axios';
import { getFcmToken } from '@lib/firebase/webPush';


const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];
const HOST = 'https://fcm.googleapis.com';
const PATH = '/v1/projects/' + 'iss-project-97e11' + '/messages:send';

interface IFcmMessage {
    title: string;
    body: string;
}

function getAccessToken() {
    return new Promise(function(resolve, reject) {
        const key = serviceAccount
        const jwtClient = new google.auth.JWT(
            key.client_email,
            undefined,
            key.private_key,
            SCOPES,
            undefined
        );
        jwtClient.authorize(function(err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens?.access_token);
        });
   });
}

async function sendFcmMessage(fcmMessage: IFcmMessage) {
    const fcmToken = getFcmToken()
    getAccessToken().then(function(accessToken) {
        const body = {
            "message": {
                "token": fcmToken,
                    "notification": {
                        "title": fcmMessage.title,
                        "body": fcmMessage.body
                    },
                    "webpush": {
                        "fcm_options": {
                            "link": "https://redboxdigital.id"
                        }
                }
            }
        }
        
        axios.post(HOST + PATH, body, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
        }).then(res => {
            console.log('Message sent to Firebase for delivery, response:');
            console.log(res.data);
        }).catch(err => {
            console.log('Unable to send message to Firebase');
            console.log(err);
        })
    });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }

        const username = req.headers.username
        const password = req.headers.password

        if (username != 'roy' || password != 'roy') {
            return res.status(401).json({message: "Unauthorized!"})
        }

        const fcmMessage = {
            title: 'Reminder',
            body: ''
        } as IFcmMessage

        if (req.query.hour = '1') {
            fcmMessage.body = 'Jangan Lupa Untuk Clock In Hari Ini'
        }

        if (req.query.hour = '2') {
            fcmMessage.body = 'Jangan Lupa Untuk Clock Out Hari Ini'
        }

        await sendFcmMessage(fcmMessage)

        return res.json({})
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

// export default protectAPI(handler);
export default (handler);
