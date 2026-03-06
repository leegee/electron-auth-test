
export interface GitHubTokenResponseGood {
    access_token: string;
    scope?: string;
    token_type?: string;
}

export interface GitHubTokenResponseBad {
    error?: string;
    error_description?: string;
    error_url?: string;
}

