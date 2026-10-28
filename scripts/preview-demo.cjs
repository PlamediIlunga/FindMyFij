// Aperçu local utilisant les données fictives déjà présentes dans le projet.
// Aucune clé Supabase n'est chargée ; les écritures restent indisponibles.
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
process.argv = ['node', 'next', 'dev', '--hostname', '127.0.0.1', '--port', '3100'];
require('next/dist/bin/next');
