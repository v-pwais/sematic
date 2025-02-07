import { User } from "@sematic/common/src/Models";
import { useHttpClient } from "@sematic/common/src/hooks/httpHooks";
import { ExtractContextType } from "@sematic/common/src/utils/typings";
import { atomWithStorage } from "jotai/utils";
import { useContext, useMemo } from "react";
import useAsync from "react-use/lib/useAsync";
import { AuthenticatePayload, EnvPayload } from "src/Payloads";
import AppContext from "src/appContext";

export const userAtom = atomWithStorage<User | null>("user", null);

export function useAppContext() {
    const contextValue = useContext(AppContext);

    if (!contextValue) {
        throw new Error("useAppContext() should be called under a provider.")
    }

    return contextValue;
}

export function useAuthentication() {
    const {fetch} = useHttpClient();

    const {value, loading, error} = useAsync(async () => {
        const response = await fetch({
            url: "/authenticate"
        });
        return (await response.json()) as AuthenticatePayload;
    }, []);

    const isAuthenticationEnabled = useMemo(
        () => value?.authenticate || false, [value]);
    
    const authProviderDetails = useMemo(() => {
        const authProviderDetails
        : ExtractContextType<typeof AppContext>["authProviderDetails"]  = {

        };
        if (!value) {
            return authProviderDetails;
        }

        if (value?.providers.GOOGLE_OAUTH_CLIENT_ID) {
            authProviderDetails["google"] = {
                GOOGLE_OAUTH_CLIENT_ID: value.providers.GOOGLE_OAUTH_CLIENT_ID
            }
        }

        if (value?.providers.GITHUB_OAUTH_CLIENT_ID) {
            authProviderDetails["github"] = {
                GITHUB_OAUTH_CLIENT_ID: value.providers.GITHUB_OAUTH_CLIENT_ID
            }
        }

        return authProviderDetails;

    }, [value]);

    return {
        isAuthenticationEnabled,
        authProviderDetails,
        loading, error
    };
}

export function useEnv(user: User | null) {
    const {fetch} = useHttpClient();

    const {value, loading, error} = useAsync(async () => {
        if (!user) {
            return null;
        }
        const response = await fetch({
            url: "/api/v1/meta/env"
        });
        return (await response.json()) as EnvPayload;
    }, [user]);

    const envVars = useMemo(() => {
        if (!value) {
            return new Map();
        }
        return new Map(Object.entries(value.env))
    }, [value]);

    return {
        loading,
        error,
        value: envVars
    };
}
