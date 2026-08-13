// oauth-hub — Standalone whitelabel hub for Meta channels.
// Copyright (C) 2026 Launcher Tecnologia (hubapp.pro.br)
// Based on oauth-hub-zdg by Comunidade ZDG (https://github.com/pedroherpeto/oauth-hub-zdg)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of version 3 of the GNU Affero General Public License as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// Source: https://github.com/launchertecnologia/oauth-hub

// ─────────────────────────────────────────────────────────────────────────────
// Shared types for oauth-hub (multi-app)
// ─────────────────────────────────────────────────────────────────────────────

export type ChannelType = "waba" | "messenger" | "instagram";
export type ForwardProduct = ChannelType | "all";

/** A forward destination ("outro ponto") that webhooks of an app are relayed to. */
export interface ForwardDest {
  id: string;
  url: string;
  products: ForwardProduct[]; // which products to relay; ["all"] = everything
  enabled: boolean;
}

/** A registered Meta app. Each app has its own credentials and webhook routing. */
export interface MetaApp {
  id: string;                 // internal key, used in the per-app webhook URL path
  name: string;
  appId: string;
  appSecret: string;          // server-only
  apiVersion: string;
  wabaConfigId: string;
  messengerConfigId: string;
  instagramAppId: string;     // falls back to appId when empty
  instagramAppSecret: string; // falls back to appSecret when empty
  messengerFallbackToken: string; // server-only; System/Page token used to resolve Pages when the Messenger OAuth returns none
  webhookVerifyToken: string;
  forwards: ForwardDest[];
  storeEvents: boolean;       // true = keep history in panel; false = relay-only (no history)
  embedEnabled: boolean;      // true = allow public embeddable connect buttons (outside the panel)
  loginEnabled: boolean;          // true = allow "Login with Facebook" for external sites (WHMCS, etc.)
  loginRedirectUris: string[];    // allow-list of external site callback URLs for the login flow
  loginApiSecret: string;         // server-only; shared secret external backends use to exchange a login code for the profile
  createdAt: string;
  updatedAt?: string;
}

/** Browser-safe projection of a MetaApp — secrets reported only as booleans. */
export interface MetaAppPublic {
  id: string;
  name: string;
  appId: string;
  apiVersion: string;
  wabaConfigId: string;
  messengerConfigId: string;
  instagramAppId: string;
  hasAppSecret: boolean;
  hasInstagramAppSecret: boolean;
  hasMessengerFallbackToken: boolean;
  webhookVerifyTokenSet: boolean;
  forwards: ForwardDest[];
  storeEvents: boolean;
  embedEnabled: boolean;
  loginEnabled: boolean;
  loginRedirectUris: string[];
  hasLoginApiSecret: boolean;
  channelCount: number;
  createdAt: string;
  webhookUrls: { unified: string; waba: string; messenger: string; instagram: string };
  redirectUri: string;
  loginUrls: { authorize: string; token: string };
}

/** Effective per-app config used by the OAuth flows (instagram falls back to fb). */
export interface AppConfig {
  app: MetaApp;
  instagramAppId: string;
  instagramAppSecret: string;
}

export interface Channel {
  id: string;
  appId: string;            // which app this channel was connected through
  type: ChannelType;
  name: string;
  externalId: string;       // phone_number_id | page_id | ig_user_id
  accessToken: string;      // server-only
  meta: Record<string, any>;
  subscribed: boolean;
  subscribeError?: string | null;
  createdAt: string;
  lastEventAt?: string | null;
}

export interface ChannelPublic {
  id: string;
  appId: string;
  appName: string;
  type: ChannelType;
  name: string;
  externalId: string;
  meta: Record<string, any>;
  subscribed: boolean;
  subscribeError?: string | null;
  createdAt: string;
  lastEventAt?: string | null;
}

export interface ForwardResult {
  url: string;
  ok: boolean;
  status: number | string;
}

export interface WebhookEvent {
  id: string;
  ts: string;
  appId: string | null;
  appName: string;
  product: ChannelType | "unknown";
  externalId: string | null;
  channelId: string | null;
  kind: string;
  direction: "in" | "system";
  summary: string;
  signatureValid: boolean | null;
  forwards: ForwardResult[]; // populated async as relays complete
  raw: any;
}

/** Decoded OAuth state token. */
export interface OAuthState {
  channel: ChannelType;
  appId: string;
  lang: string;
  nonce: string;
  iat: number;
}

/** Decoded state for the Facebook Login (site authentication) flow. */
export interface LoginState {
  appId: string;
  redirectUri: string; // the external site's callback URL (validated against the app's allow-list)
  siteState: string;   // opaque state the external site asked to get back untouched
  lang: string;
  nonce: string;
  iat: number;
}

/** Profile resolved from Facebook after a successful Login flow. */
export interface FacebookLoginProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
}
