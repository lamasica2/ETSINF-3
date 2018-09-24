# TSR_ZMQ

2.1 Aproximació al problema i aspectes clau 

L'objectiu d'aquest apartat és la implementació d'un proxy que gestione missatges de petició 
de servei. En els problemes clàssics de programació concurrent hi ha un model conegut com a
productor-consumidor que consta d'un espai d'emmagatzematge limitat (bounded buffer) per
a intercanvi. 

 Els processos amb rol productor dipositen (escriuen) en aquest espai un element que
els de rol consumidor retiren (consumeixen). 

L'estudi d'aquest problema se centra a coordinar (sincronització condicional) tots dos tipus de
procés sabent que el emmagatzematge es pot omplir o buidar. 
 En una situació d'espai buit, els consumidors han de quedar a l'espera de l'arribada
d'un nou element.

 En la situació contrària (emmagatzematge ple), són els productors els que han
d'esperar fins que es produïsca un buit. 
En el cas extrem que l'emmagatzematge intermedi desapareix, i totes les operacions
s'implementen mitjançant missatges, aquest model de referència s'aproxima més a l'esquema
aplicable a aquest apartat. 

Amb una mica més de detall, el comportament esperat dels agents que participen és: 
 Existeixen processos (clients) que sol·liciten serveis. Per a fer-ho construeixen
(produeixen) un missatge que han d'enviar a algun servidor (treballador). Si n’hi ha
algun disponible, podrà fer-se càrrec de la petició; en cas contrari el client haurà
d'esperar.

o Una vegada s'aconsegueix  trobar un treballador que processe aquesta petició,
el client es mantindrà a l'espera de rebre el resultat (un altre missatge),
moment en el qual podrà continuar amb la resta de la seua activitat.

 D'altra banda, els treballadors són altres processos que ofereixen serveis. Per a fer-ho
construeixen (produeixen) un missatge per a anunciar la seua disponibilitat. Si hi ha
algun client esperant, podran fer-se càrrec de la seua petició; en cas contrari quedaran
a l'espera.

o Una vegada el treballador aconsegueix una petició, la processarà i retornarà 
un missatge amb dos significats: el resultat per al client i l'avís que el
treballador torna a estar disponible.

o Excepcionalment, el primer missatge enviat pel treballador únicament
anunciarà la seua disponibilitat ja que no hi ha resultat que comunicar. 

 És molt interessant que, per a fer d’intermediari entre aquests dos tipus de processos,
apareix un tercer agent (proxy o broker) que casa  les peticions i oferiments de servei.


En termes de comunicacions basades en ØMQ, aquest proxy, o intermediari, tindrà la
següent funcionalitat: 
 Presentarà un socket ØMQ de tipus ROUTER, on acceptarà connexions remotes dels
clients (els qui li enviaran missatges de petició de servei). Anomenem frontend a
aquest socket. 
 Presentarà un altre socket ØMQ de tipus ROUTER, on acceptarà connexions remotes
dels servidors o treballadors (els qui atendran les peticions de servei que els arriben).
Anomenem backend a aquest socket. 
 Quan un client, des del seu socket ØMQ de tipus REQ, envie una petició de servei
(missatge) cap al socket frontend, el proxy seleccionarà un treballador, i li passarà el
missatge pel socket backend. 
 Una vegada s'atenga la petició de servei (el missatge), el treballador que l'haja atès ho
comunica, des del seu socket ØMQ de tipus REQ, mitjançant una petició enviada al
proxy, pel socket backend. 
 Quan arribe aquesta petició d'un treballador pel socket backend, el proxy l'ha de
reexpedir pel socket frontend al client que va enviar la petició original. 

 La gestió dels missatges descrita exigeix que el proxy conega les identitats de clients i
treballadors.


                                                           
