/**
 * Prefijo para archivos de /public.
 *
 * ¿Por qué hace falta? En GitHub Pages el sitio no vive en la raíz del
 * dominio sino en un subdirectorio: usuario.github.io/<nombre-del-repo>.
 * Next reescribe solo por su cuenta los <Link> y next/image; una ruta
 * escrita a mano como <img src="/hero.svg"> apuntaría a
 * jdvalencir.github.io/hero.svg y daría 404.
 *
 * En local y en Vercel NEXT_PUBLIC_BASE_PATH está vacío, así que
 * asset("/hero.svg") devuelve "/hero.svg" y no cambia nada.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
