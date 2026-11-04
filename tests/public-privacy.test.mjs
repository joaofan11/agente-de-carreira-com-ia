import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Route, Routes, Navigate, Link, Outlet } from 'react-router-dom';
import { loadSourceModule } from './helpers/backend-handler.mjs';

const wrapper = ({ children }) => React.createElement('div', null, children);
const icon = () => null;
const Privacy = loadSourceModule(new URL('../src/pages/Privacidade.jsx', import.meta.url), {
  React, PageHeader: ({ title }) => React.createElement('h1', null, title), Card: wrapper, CardContent: wrapper,
  ShieldCheck: icon, FileText: icon, Eye: icon, Trash2: icon, Bell: icon, Lock: icon, UserCheck: icon,
});
function renderApp(path, auth) {
  let redirects = 0;
  const App = loadSourceModule(new URL('../src/App.jsx', import.meta.url), {
    React, Router: ({ children }) => React.createElement(StaticRouter, { location: path }, children),
    Route, Routes, Navigate, Link, Privacidade: Privacy, AuthProvider: wrapper, QueryClientProvider: wrapper,
    queryClientInstance: {}, Toaster: icon, ScrollToTop: icon,
    useAuth: () => ({ isLoadingAuth: false, isLoadingPublicSettings: false, ...auth, navigateToLogin: () => { redirects++; } }),
    ProtectedRoute: Outlet, AppLayout: Outlet, Dashboard: () => React.createElement('h1', null, 'Private dashboard'),
  });
  return { html: renderToString(React.createElement(App)), get redirects() { return redirects; } };
}
test('privacy is reachable before signup despite an authentication-required state', () => {
  const result = renderApp('/privacidade', { authError: { type: 'auth_required' } });
  assert.equal(result.redirects, 0);
  assert.ok(result.html.includes('Política de Privacidade'));
  assert.ok(result.html.includes('mailto:anexa.ia.opercao@gmail.com'));
  assert.ok(result.html.includes('18 anos ou mais'));
  for (const name of ['João Fernandes de Araujo Neto', 'Jayne Douranth Moreira', 'Adriel Miguel Duarte de Melo', 'Joel da Silva de Lima']) assert.ok(result.html.includes(name));
});
test('making privacy public preserves the dashboard authentication boundary', () => {
  const result = renderApp('/dashboard', { authError: { type: 'auth_required' } });
  assert.equal(result.redirects, 1);
  assert.equal(result.html.includes('Private dashboard'), false);
});
test('authenticated dashboard still resolves through the existing app routes', () => {
  const result = renderApp('/dashboard', { authError: null });
  assert.equal(result.redirects, 0);
  assert.ok(result.html.includes('Private dashboard'));
});
