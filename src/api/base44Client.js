import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const rawClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Proxy handler to ensure entity list() and filter() always return Arrays
const entitiesProxy = new Proxy(rawClient.entities || {}, {
  get(target, entityName) {
    const entity = target[entityName] || {};
    return new Proxy(entity, {
      get(eTarget, prop) {
        const origMethod = eTarget[prop];
        if (typeof origMethod === 'function') {
          return async (...args) => {
            try {
              const res = await origMethod.apply(eTarget, args);
              if (prop === 'list' || prop === 'filter') {
                return Array.isArray(res) ? res : [];
              }
              return res;
            } catch (err) {
              if (prop === 'list' || prop === 'filter') {
                return [];
              }
              return null;
            }
          };
        }
        return origMethod;
      }
    });
  }
});

export const base44 = new Proxy(rawClient, {
  get(target, prop) {
    if (prop === 'entities') {
      return entitiesProxy;
    }
    return target[prop];
  }
});
