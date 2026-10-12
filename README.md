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

In **Settings → Pages → Build and deployment**, seleziona **GitHub Actions**. Il workflow `.github/workflows/pages.yml` esegue test e build e pubblica `dist/` a ogni push su `main`; può anche essere avviato da **Actions → Publish GitHub Pages → Run workflow**.

Gli asset usano percorsi relativi, compatibili con il sottopercorso `/timer-g/`. Non servono token o segreti applicativi. Se GitHub Pages o Actions non sono abilitati nel repository, occorre abilitarli prima del deploy.
