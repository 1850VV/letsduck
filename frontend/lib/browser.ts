import {jsonParse} from '../shared/json.js';
export const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function storedJson(key: string): unknown { const text = localStorage.getItem(key); return text === null ? null : jsonParse(text); }
export const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
export function required<T>(value: T | null | undefined, label = 'Missing value'): T { if (value == null) throw Error(label); return value; }
export function defined<T>(value: T | undefined, label = 'Missing value'): T { if (value === undefined) throw Error(label); return value; }
export function query<T extends HTMLElement = HTMLElement>(selector: string): T { return required(document.querySelector<T>(selector), `Missing element: ${selector}`); }
export const queryAll = <T extends HTMLElement = HTMLElement>(selector: string): T[] => [...document.querySelectorAll<T>(selector)];
export function targetElement(event: Event): HTMLElement | null { const target = event.target; return target instanceof HTMLElement ? target : target instanceof Element ? target.parentElement : null; }
export const eventElement = (event: Event): HTMLElement => required(targetElement(event), 'Missing event target');
export function valueElement(event: Event): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement { const target=event.target; if(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return target; throw Error('Expected form control'); }
export function inputElement(event: Event): HTMLInputElement { const target=event.target; if(target instanceof HTMLInputElement) return target; throw Error('Expected input'); }
export function stringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === 'string') : []; }
