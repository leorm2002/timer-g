# timer/g

Un timer in italiano, semplice e responsive. Durata personalizzabile, preset Focus (25 min), Pausa breve (5 min) e Pausa lunga (15 min), avvio/pausa, reset, aggiunta di un minuto, suono finale e schermo intero.

Il conto alla rovescia usa una scadenza assoluta: recupera il tempo trascorso anche quando la scheda viene sospesa. Durata, stato e preferenza audio vengono salvati solo nel browser, senza account o servizi esterni. Il suono dipende dalle impostazioni audio del browser; una scheda sospesa può mostrare e suonare la scadenza al ritorno in primo piano.

## Sviluppo

Richiede Node.js 24 e npm.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

I test verificano scadenza, sospensione della scheda, pausa/ripresa, reset, ripristino, aggiunta di tempo e validazione delle durate. Premi **Spazio** per avviare o mettere in pausa e **R** per ricominciare quando il focus non è su un controllo.

## GitHub Pages

La configurazione attiva è **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root)**. GitHub Pages pubblica il sito a ogni push su `main`. HTML, CSS e moduli JavaScript funzionano direttamente nel browser e usano percorsi relativi, compatibili con il sottopercorso `/timer-g/`. Il file `.nojekyll` mantiene la pubblicazione statica.

Il workflow `.github/workflows/ci.yml` esegue separatamente test e build Vite a ogni push e pull request su `main`. Non è richiesto un secondo workflow di deploy: la pubblicazione è gestita dal workflow automatico di Pages. Non servono token o segreti applicativi.
