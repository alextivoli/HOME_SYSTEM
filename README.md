Home System - Progetto di Sistemi Orientati ad Internet

Questa repository contiene il codice sorgente dell'applicazione Web sviluppata per il progetto di Sistemi Orientati ad Internet. L'applicazione simula la temperatura esterna e consente il controllo di vari sensori in una stanza di casa, tra cui una porta, una pompa di calore e finestre.
Introduzione

La relazione fornisce un'overview dell'architettura dell'applicazione, composta da un server back-end, servizi per la simulazione del tempo atmosferico e la gestione dei sensori, un attuatore e un front-end per l'interazione dell'utente.

L'applicazione è accessibile via HTTP all'indirizzo http://alex-tivoli.soi2223.unipr.it:8080/.

Il codice sorgente dell'applicazione è disponibile nella repository GitHub: HOME_SYSTEM
Frontend (Capitolo 1)

Il frontend richiede l'accesso tramite il login con credenziali Google. Offre un'interfaccia per controllare la temperatura della stanza, gestire la pompa di calore, le finestre e la porta. Il frontend è basato su container Docker e utilizza Web Socket per comunicare con il backend.
Backend (Capitolo 2)

Il backend è connesso a tutti i servizi attivi, l'attuatore e il frontend. Opera all'interno di un container Docker, raccoglie informazioni dai sensori tramite Web Socket, invia dati al frontend e gestisce i comandi dell'utente, che vengono inoltrati all'attuatore tramite chiamate REST.
Microservizi (Capitolo 3)

Ogni microservizio è isolato in un container Docker per garantire un'implementazione modulare e scalabile.

Attuatore (Porta 8084): Intermediario per le chiamate REST, gestisce le richieste dal backend e le inoltra al microservizio corretto.

Pompa di Calore (Porta 8083): Mantiene lo stato e la temperatura della pompa di calore, ricevendo e inviando informazioni all'attuatore e al backend.

Porta (Porta 8082): Mantiene lo stato della porta, riceve e invia informazioni all'attuatore e al backend.

Finestre (Porta 8085): Mantiene lo stato e la lista delle finestre attive, ricevendo e inviando informazioni all'attuatore e al backend.

Tempo Atmosferico (Porta 8081): Invia la temperatura simulata al backend.

Termometro (Porta 8086): Mantiene aggiornata la temperatura della stanza, ricevendo e inviando informazioni tramite Web Socket.