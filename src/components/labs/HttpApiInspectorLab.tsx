import React, { useState } from 'react';
import { Send, KeyRound, Code2 } from 'lucide-react';
import { playClick, playError, playSuccess } from '../../utils/sound';

type HttpMethod = 'GET' | 'POST' | 'DELETE';
type UserRole = 'guest' | 'user' | 'admin';

interface EndpointDef {
  path: string;
  label: string;
  description: string;
}

const ENDPOINTS: EndpointDef[] = [
  { path: '/api/iles', label: '/api/iles', description: 'Liste publique des 12 îles de Cyberland' },
  { path: '/api/billets', label: '/api/billets', description: 'Création ou consultation de billets (authentifié)' },
  { path: '/api/admin/cles', label: '/api/admin/cles', description: 'Gestion des clés serveur (Admin requis)' },
  { path: '/api/ancien-port', label: '/api/ancien-port', description: 'Ancienne adresse déplacée définitivement' },
  { path: '/api/ile-fantome', label: '/api/ile-fantome', description: 'Ressource inexistante sur le serveur' },
  { path: '/api/paiement-surcharge', label: '/api/paiement-surcharge', description: 'Service temporairement saturé' },
];

interface SimulatedResponse {
  status: number;
  statusText: string;
  meaning: string;
  headers: Record<string, string>;
  body: string;
  category: 'ok' | 'redirect' | 'client-err' | 'server-err';
}

function simulateHttp(method: HttpMethod, path: string, role: UserRole): SimulatedResponse {
  const baseHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    Server: 'CyberCloud-Gateway/2.0',
    'Strict-Transport-Security': 'max-age=31536000',
  };

  if (path === '/api/ancien-port') {
    return {
      status: 301,
      statusText: 'Moved Permanently',
      meaning: 'Redirection permanente : la ressource a déménagé vers une nouvelle URL (/api/iles).',
      headers: { ...baseHeaders, Location: 'https://api.cyberland.gem/api/iles' },
      body: JSON.stringify({ message: 'Redirection permanente vers /api/iles' }, null, 2),
      category: 'redirect',
    };
  }

  if (path === '/api/ile-fantome') {
    return {
      status: 404,
      statusText: 'Not Found',
      meaning: 'Ressource introuvable : le serveur fonctionne mais l’URL demandée n’existe pas.',
      headers: baseHeaders,
      body: JSON.stringify({ erreur: 'NOT_FOUND', detail: 'Aucune île trouvée à cette adresse.' }, null, 2),
      category: 'client-err',
    };
  }

  if (path === '/api/paiement-surcharge') {
    return {
      status: 503,
      statusText: 'Service Unavailable',
      meaning: 'Erreur côté serveur : le service est saturé ou en maintenance (pensez à l’Auto-Scaling !).',
      headers: { ...baseHeaders, 'Retry-After': '30' },
      body: JSON.stringify({ erreur: 'SERVICE_UNAVAILABLE', detail: 'Pic de trafic détecté, réessayez.' }, null, 2),
      category: 'server-err',
    };
  }

  if (path === '/api/admin/cles') {
    if (role === 'guest') {
      return {
        status: 401,
        statusText: 'Unauthorized',
        meaning: 'Non authentifié : aucun jeton (Bearer Token) n’a été fourni dans l’en-tête Authorization.',
        headers: { ...baseHeaders, 'WWW-Authenticate': 'Bearer realm="Cyberland"' },
        body: JSON.stringify({ erreur: 'UNAUTHORIZED', detail: 'Veuillez vous connecter avec un jeton.' }, null, 2),
        category: 'client-err',
      };
    }
    if (role === 'user') {
      return {
        status: 403,
        statusText: 'Forbidden',
        meaning: 'Interdit : vous êtes bien identifié, mais votre rôle "Utilisateur" n’a pas les droits Admin (moindre privilège).',
        headers: baseHeaders,
        body: JSON.stringify({ erreur: 'FORBIDDEN', detail: 'Rôle Administrateur requis pour cette route.' }, null, 2),
        category: 'client-err',
      };
    }
    return {
      status: 200,
      statusText: 'OK',
      meaning: 'Succès : identité et privilèges Admin vérifiés selon la règle Zero Trust.',
      headers: baseHeaders,
      body: JSON.stringify({ statut: 'autorise', action: method, rotationCles: 'TLS 1.3 actif' }, null, 2),
      category: 'ok',
    };
  }

  if (path === '/api/billets') {
    if (role === 'guest') {
      return {
        status: 401,
        statusText: 'Unauthorized',
        meaning: 'Non authentifié : passez au rôle Utilisateur ou Admin pour inclure un jeton Bearer.',
        headers: baseHeaders,
        body: JSON.stringify({ erreur: 'UNAUTHORIZED', detail: 'Jeton d’authentification manquant.' }, null, 2),
        category: 'client-err',
      };
    }
    if (method === 'POST') {
      return {
        status: 201,
        statusText: 'Created',
        meaning: 'Ressource créée avec succès suite à une requête POST.',
        headers: baseHeaders,
        body: JSON.stringify({ id: 'BIL-2026-842', ile: 'Cyberland', statut: 'confirmé' }, null, 2),
        category: 'ok',
      };
    }
    if (method === 'DELETE') {
      return {
        status: 200,
        statusText: 'OK',
        meaning: 'Suppression effectuée par la méthode DELETE.',
        headers: baseHeaders,
        body: JSON.stringify({ supprime: true, id: 'BIL-2026-842' }, null, 2),
        category: 'ok',
      };
    }
    return {
      status: 200,
      statusText: 'OK',
      meaning: 'Lecture réussie via la méthode GET.',
      headers: baseHeaders,
      body: JSON.stringify({ billets: [{ id: 'BIL-2026-842', passager: 'Architecte' }] }, null, 2),
      category: 'ok',
    };
  }

  // Default /api/iles
  if (method !== 'GET') {
    return {
      status: 403,
      statusText: 'Forbidden',
      meaning: 'Le catalogue public /api/iles est en lecture seule (utilisez GET).',
      headers: baseHeaders,
      body: JSON.stringify({ erreur: 'READ_ONLY', detail: 'Seule la méthode GET est autorisée ici.' }, null, 2),
      category: 'client-err',
    };
  }

  return {
    status: 200,
    statusText: 'OK',
    meaning: 'Requête HTTP réussie : le serveur renvoie les données JSON demandées.',
    headers: baseHeaders,
    body: JSON.stringify(
      { archipel: 'Cyberland', totalIles: 12, statut: 'opérationnel' },
      null,
      2
    ),
    category: 'ok',
  };
}

export const HttpApiInspectorLab: React.FC = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [endpoint, setEndpoint] = useState<string>('/api/iles');
  const [role, setRole] = useState<UserRole>('guest');
  const [response, setResponse] = useState<SimulatedResponse>(() =>
    simulateHttp('GET', '/api/iles', 'guest')
  );

  const handleSend = () => {
    const res = simulateHttp(method, endpoint, role);
    setResponse(res);
    if (res.category === 'ok' || res.category === 'redirect') {
      playSuccess();
    } else {
      playError();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Request Builder */}
      <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Client REST interactif · Codes HTTP (2xx, 3xx, 4xx, 5xx)
          </p>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Construire votre requête HTTP
          </h2>
        </div>

        {/* Method */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            1. Verbe HTTP
          </p>
          <div className="flex items-center gap-2">
            {(['GET', 'POST', 'DELETE'] as HttpMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  playClick();
                  setMethod(m);
                }}
                className={`px-3.5 py-2 text-xs font-mono font-bold rounded-lg border transition-colors ${
                  method === m
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            2. Route API cible
          </p>
          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.path}
                type="button"
                onClick={() => {
                  playClick();
                  setEndpoint(ep.path);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors ${
                  endpoint === ep.path
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="font-mono text-xs font-bold">{ep.label}</p>
                <p className="text-[11px] opacity-80">{ep.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Token / Role */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            3. En-tête Authorization (Jeton)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'guest', label: 'Aucun jeton' },
                { id: 'user', label: 'Utilisateur' },
                { id: 'admin', label: 'Admin' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  playClick();
                  setRole(r.id);
                }}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  role === r.id
                    ? 'bg-slate-900 dark:bg-sky-700 text-white border-slate-900 dark:border-sky-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          Envoyer la requête HTTPS
        </button>
      </section>

      {/* Right: Raw Response & Status Explainer */}
      <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Réponse du serveur Cyberland
            </h3>
          </div>
          <span
            className={`font-mono text-sm font-bold tabular-nums ${
              response.category === 'ok'
                ? 'text-emerald-700 dark:text-emerald-400'
                : response.category === 'redirect'
                ? 'text-sky-700 dark:text-sky-400'
                : response.category === 'client-err'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            HTTP/2 {response.status} {response.statusText}
          </span>
        </div>

        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
            response.category === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : response.category === 'redirect'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}
        >
          <strong>Signification du code {response.status} :</strong> {response.meaning}
        </div>

        {/* Raw HTTP Trace */}
        <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-3 overflow-x-auto border border-slate-800">
          <div className="space-y-0.5 text-sky-300">
            <p>
              &gt; {method} {endpoint} HTTP/2
            </p>
            <p>&gt; Host: api.cyberland.gem</p>
            {role !== 'guest' && (
              <p>&gt; Authorization: Bearer token_{role}_cyberland_9f8a</p>
            )}
          </div>
          <div className="border-t border-slate-800 pt-2.5 space-y-0.5 text-slate-300">
            <p className="text-emerald-400 font-semibold">
              &lt; HTTP/2 {response.status} {response.statusText}
            </p>
            {Object.entries(response.headers).map(([k, v]) => (
              <p key={k}>
                &lt; {k}: {v}
              </p>
            ))}
          </div>
          <pre className="border-t border-slate-800 pt-2.5 text-amber-200 whitespace-pre-wrap">
            {response.body}
          </pre>
        </div>

        {/* Quick HTTP Family Reference */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {[
            { code: '2xx', label: 'Succès (200, 201)', tone: 'text-emerald-700 dark:text-emerald-400' },
            { code: '3xx', label: 'Redirection (301)', tone: 'text-sky-700 dark:text-sky-400' },
            { code: '4xx', label: 'Erreur Client (401, 403, 404)', tone: 'text-amber-700 dark:text-amber-400' },
            { code: '5xx', label: 'Erreur Serveur (500, 503)', tone: 'text-red-700 dark:text-red-400' },
          ].map((fam) => (
            <div
              key={fam.code}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700"
            >
              <p className={`font-mono font-bold ${fam.tone}`}>{fam.code}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{fam.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
