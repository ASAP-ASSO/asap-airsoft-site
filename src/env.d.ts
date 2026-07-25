/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import('./db/index').User | null;
    session: import('./db/index').Session | null;
  }
}
