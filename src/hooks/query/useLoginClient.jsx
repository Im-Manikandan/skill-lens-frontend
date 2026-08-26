// Imports
import {useMutation} from '@tanstack/react-query';
import {useDispatch} from 'react-redux';
import {decompressFflate} from '@devopsthink/react-security-util';
import AuthController from '../../api/auth/auth-controller';
import {setAuthToken} from '../../store/apps/auth/AuthSlice';
import {setUserInfo} from '../../store/apps/auth/UserInfoSlice';
import {setUserType} from '../../store/apps/auth/UserTypeSlice';
import ApiUtils from "src/api/ApiUtils.jsx";
import {setToken} from "src/api/fetch-helpers.jsx";

// Client Login Mutation Hook
const useLoginClient = () => {
    const dispatch = useDispatch();

    return useMutation({
        retry: false,
        mutationFn: (credentials) => AuthController.loginClientAdmin(credentials),
        // On Success: Decompress payload, persist auth state to store and localStorage
        onSuccess: (data) => {
            const userInfo = JSON.parse(decompressFflate(data.payload));
            const tokenData = {
                access_token: data.access_token,
                token_type: data.token_type,
                expires_in: data.expires_in,
            };
            ApiUtils.setLocalStorage("userInfo", userInfo);
            setToken(data.access_token);
            dispatch(setAuthToken(tokenData));
            dispatch(setUserInfo(data.payload));
            dispatch(setUserType('client'));
        },
    });
};

export default useLoginClient;
