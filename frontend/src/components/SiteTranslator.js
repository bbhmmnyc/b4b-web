import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { getLanguage, isKnownUiTranslation } from '../i18n';

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'];
const TRANSLATABLE_META_SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
].join(',');
const SKIPPED_SELECTOR = [
  '[data-no-site-translate]',
  '[translate="no"]',
  '[contenteditable="true"]',
  'script',
  'style',
  'noscript',
  'code',
  'pre',
].join(',');
const MAX_TEXT_LENGTH = 1000;
const MAX_BATCH_ITEMS = 50;
const MAX_BATCH_CHARACTERS = 12000;

function splitWhitespace(value) {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return {
    leading: match?.[1] || '',
    text: match?.[2] || '',
    trailing: match?.[3] || '',
  };
}

function isUsefulSourceText(value) {
  const text = value.trim();
  if (text.length < 2 || text.length > MAX_TEXT_LENGTH) return false;
  if (!/\p{L}/u.test(text)) return false;
  if (/^(?:https?:\/\/|www\.|mailto:)/i.test(text)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
  return true;
}

function isSkipped(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return Boolean(element?.closest(SKIPPED_SELECTOR));
}

function storageKey(language, source) {
  return `b4b_translation:${language}:${source}`;
}

export default function SiteTranslator() {
  const { API, language, t } = useApp();
  const [translationError, setTranslationError] = useState('');
  const textRecords = useRef(new WeakMap());
  const trackedTextNodes = useRef(new Set());
  const attributeRecords = useRef(new WeakMap());
  const trackedElements = useRef(new Set());
  const memoryCache = useRef(new Map());

  useEffect(() => {
    setTranslationError('');
    const activeLanguage = getLanguage(language);
    document.documentElement.lang = activeLanguage.code;
    document.documentElement.dir = activeLanguage.direction;

    let disposed = false;
    let flushTimer = null;
    let scanTimer = null;
    let warned = false;
    const abortController = new AbortController();
    const pending = new Map();
    const failed = new Set();

    const restoreTrackedContent = () => {
      for (const node of trackedTextNodes.current) {
        if (!node.isConnected) {
          trackedTextNodes.current.delete(node);
          continue;
        }
        const record = textRecords.current.get(node);
        if (record && record.rendered && node.data === record.rendered) {
          node.data = record.source;
        }
        if (record) {
          record.rendered = null;
          record.pendingLanguage = null;
        }
      }

      for (const element of trackedElements.current) {
        if (!element.isConnected) {
          trackedElements.current.delete(element);
          continue;
        }
        const records = attributeRecords.current.get(element);
        if (!records) continue;
        for (const [attribute, record] of records) {
          if (record.rendered && element.getAttribute(attribute) === record.rendered) {
            element.setAttribute(attribute, record.source);
          }
          record.rendered = null;
          record.pendingLanguage = null;
        }
      }
    };

    restoreTrackedContent();
    if (language === 'en') return undefined;

    const readCached = (source) => {
      const key = storageKey(language, source);
      if (memoryCache.current.has(key)) return memoryCache.current.get(key);
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          memoryCache.current.set(key, stored);
          return stored;
        }
      } catch {}
      return null;
    };

    const cacheTranslation = (source, translated) => {
      const key = storageKey(language, source);
      memoryCache.current.set(key, translated);
      try {
        sessionStorage.setItem(key, translated);
      } catch {}
    };

    const flush = async () => {
      flushTimer = null;
      while (!disposed && pending.size > 0) {
        const batch = [];
        let characters = 0;
        for (const [source, callbacks] of pending) {
          if (batch.length >= MAX_BATCH_ITEMS || characters + source.length > MAX_BATCH_CHARACTERS) break;
          pending.delete(source);
          batch.push({ source, callbacks });
          characters += source.length;
        }

        if (batch.length === 0) break;
        try {
          const response = await axios.post(`${API}/translate/ui`, {
            texts: batch.map((item) => item.source),
            source_language: 'en',
            target_language: language,
          }, { signal: abortController.signal });

          if (disposed) return;
          batch.forEach((item, index) => {
            const translated = response.data.translations?.[index] || item.source;
            cacheTranslation(item.source, translated);
            item.callbacks.forEach((callback) => callback(translated));
          });
        } catch (error) {
          if (disposed || error.code === 'ERR_CANCELED') return;
          batch.forEach((item) => {
            failed.add(item.source);
            item.callbacks.forEach((callback) => callback(null));
          });
          if (!warned) {
            warned = true;
            setTranslationError(t('translationUnavailable'));
            console.warn('Site translation is unavailable:', error.response?.data?.detail || error.message);
          }
        }
      }
    };

    const enqueue = (source, callback) => {
      const cached = readCached(source);
      if (cached) {
        callback(cached);
        return;
      }
      if (failed.has(source)) {
        callback(null);
        return;
      }
      const callbacks = pending.get(source) || [];
      callbacks.push(callback);
      pending.set(source, callbacks);
      if (!flushTimer) flushTimer = window.setTimeout(flush, 25);
    };

    const translateTextNode = (node) => {
      if (!node.isConnected || isSkipped(node)) return;
      let record = textRecords.current.get(node);
      if (!record) {
        record = { source: node.data, rendered: null, pendingLanguage: null };
        textRecords.current.set(node, record);
        trackedTextNodes.current.add(node);
      } else if (node.data !== record.source && node.data !== record.rendered) {
        record.source = node.data;
        record.rendered = null;
        record.pendingLanguage = null;
      }

      const { leading, text, trailing } = splitWhitespace(record.source);
      if (!isUsefulSourceText(text) || isKnownUiTranslation(language, text)) return;
      if (record.rendered && node.data === record.rendered) return;
      if (record.pendingLanguage === language) return;

      record.pendingLanguage = language;
      enqueue(text, (translated) => {
        record.pendingLanguage = null;
        if (!translated || disposed || !node.isConnected || node.data !== record.source) return;
        record.rendered = `${leading}${translated}${trailing}`;
        node.data = record.rendered;
      });
    };

    const translateAttribute = (element, attribute) => {
      const current = element.getAttribute(attribute);
      if (!current || isSkipped(element)) return;
      let records = attributeRecords.current.get(element);
      if (!records) {
        records = new Map();
        attributeRecords.current.set(element, records);
        trackedElements.current.add(element);
      }
      let record = records.get(attribute);
      if (!record) {
        record = { source: current, rendered: null, pendingLanguage: null };
        records.set(attribute, record);
      } else if (current !== record.source && current !== record.rendered) {
        record.source = current;
        record.rendered = null;
        record.pendingLanguage = null;
      }

      if (!isUsefulSourceText(record.source) || isKnownUiTranslation(language, record.source)) return;
      if (record.rendered && current === record.rendered) return;
      if (record.pendingLanguage === language) return;

      record.pendingLanguage = language;
      enqueue(record.source, (translated) => {
        record.pendingLanguage = null;
        if (!translated || disposed || !element.isConnected || element.getAttribute(attribute) !== record.source) return;
        record.rendered = translated;
        element.setAttribute(attribute, translated);
      });
    };

    const scan = () => {
      scanTimer = null;
      if (disposed || !document.body) return;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        translateTextNode(node);
        node = walker.nextNode();
      }
      document.body.querySelectorAll(TRANSLATABLE_ATTRIBUTES.map((name) => `[${name}]`).join(','))
        .forEach((element) => {
          TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
            if (element.hasAttribute(attribute)) translateAttribute(element, attribute);
          });
        });
      const titleNode = document.querySelector('title')?.firstChild;
      if (titleNode) translateTextNode(titleNode);
      document.querySelectorAll(TRANSLATABLE_META_SELECTORS)
        .forEach((element) => translateAttribute(element, 'content'));
    };

    const scheduleScan = () => {
      if (!scanTimer) scanTimer = window.setTimeout(scan, 40);
    };

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES, 'content'],
    });
    scan();

    return () => {
      disposed = true;
      observer.disconnect();
      abortController.abort();
      if (flushTimer) window.clearTimeout(flushTimer);
      if (scanTimer) window.clearTimeout(scanTimer);
    };
  }, [API, language, t]);

  if (!translationError || language === 'en') return null;
  return (
    <div
      className="fixed left-1/2 top-20 z-[110] w-[min(92vw,42rem)] -translate-x-1/2 border border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900 shadow-lg"
      role="alert"
      data-testid="site-translation-error"
      data-no-site-translate
    >
      {translationError}
    </div>
  );
}
