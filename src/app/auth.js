/* eslint-disable */
import {
    CognitoAuth,
    StorageHelper
} from 'amazon-cognito-auth-js';
import IndexRouter from '../router/index';
import UserInfoStore from './user-info-store';
import UserInfoApi from './user-info-api';
import jwt_decode from 'jwt-decode';

const CLIENT_ID = process.env.VUE_APP_COGNITO_CLIENT_ID;
const APP_DOMAIN = process.env.VUE_APP_COGNITO_APP_DOMAIN;
const REDIRECT_URI = process.env.VUE_APP_COGNITO_REDIRECT_URI;
const USERPOOL_ID = process.env.VUE_APP_COGNITO_USERPOOL_ID;
const REDIRECT_URI_SIGNOUT = process.env.VUE_APP_COGNITO_REDIRECT_URI_SIGNOUT;
const APP_URL = process.env.VUE_APP_APP_URL;

var authData = {
    ClientId: CLIENT_ID, // Your client id here
    AppWebDomain: APP_DOMAIN,
    TokenScopesArray: ['phone', 'openid', 'email', 'aws.cognito.signin.user.admin', 'profile'],
    RedirectUriSignIn: REDIRECT_URI,
    RedirectUriSignOut: REDIRECT_URI_SIGNOUT,
    UserPoolId: USERPOOL_ID,
}

var auth = new CognitoAuth(authData);
auth.userhandler = {
    onSuccess: function (result) {
        console.log("On Success result", result);
        var decodedAccessToken = jwt_decode(result.accessToken.jwtToken);
        var decodedIdToken = jwt_decode(result.idToken.jwtToken);
        var decodedRefreshToken = (result.refreshToken);
        UserInfoStore.setDecodedAccessTokenInfo(decodedAccessToken);
        UserInfoStore.setDecodedIdTokenInfo(decodedIdToken);
        UserInfoStore.setDecodedRefreshTokenInfo(decodedRefreshToken);
        UserInfoStore.setLoggedIn(true);
        UserInfoApi.getUserInfo().then(response => {
            IndexRouter.push('/');
        });
    },
    onFailure: function (err) {
        UserInfoStore.setLoggedOut();
        IndexRouter.go({
            path: '/error',
            query: {
                message: 'Login failed due to ' + err
            }
        });
    }
};

function getTokensInfo(name) {
    let match = RegExp('[#&]' + name + '=([^&]*)').exec(window.location.hash);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function getUserInfoStorageKey() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + auth.getClientId();
    var tokenUserName = auth.signInUserSession.getAccessToken().getUsername();
    var userInfoKey = keyPrefix + '.' + tokenUserName + '.userInfo';
    return userInfoKey;
}

var storageHelper = new StorageHelper();
var storage = storageHelper.getStorage();
export default {
    auth: auth,
    login() {
        auth.getSession();
    },
    logout() {
        if (auth.isUserSignedIn()) {
            var userInfoKey = this.getUserInfoStorageKey();
            auth.signOut();

            storage.removeItem(userInfoKey);
        }
    },
    getUserInfoStorageKey,

}
