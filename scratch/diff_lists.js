const realListStr = "a.e.milan@hotmail.fr, adrien.col@laposte.net, agone85@gmail.com, alix.b@live.com, alt.nk-2o7lg2up@yopmail.com, andreas.herbstreith@gmail.com, annacorbel.ortho@yahoo.fr, anneclaire79@hotmail.fr, annemariebourges@outlook.com, annesojean@wanadoo.fr, antonin.mestric@gmail.com, as.blanchet22@gmail.com, axbguv@gmail.com, baptiste.gilbert@hotmail.fr, binouzcaurel@gmail.com, blacknails91@yahoo.fr, bm_gaia@proton.me, bricethomas.adrfaso@gmail.com, buckulcikadriane@gmail.com, caribot806@gmail.com, catherine.abelard@gmail.com, ch.teinturier@gmail.com, chasseloup.gladys@gmail.com, clerun61@gmail.com, crombezcamala1@gmail.com, daniel.perennes@orange.fr, didier.teinturier@gmail.com, emilie.lmo@hotmail.fr, evencedum@hotmail.fr, fanfantanguy22@gmail.com, fdvos@me.com, ferriergwenaelle@gmail.com, francoisczi@orange.fr, gerard.munier22@gmail.com, gladys.quemener@gmail.com, goliathbouba1@gmail.com, goliathbouba1@yahoo.fr, ines.leraud.ext@proton.me, izaude22@gmail.com, jeannie.blin@gmail.com, jeffrieju@gmail.com, jl.bonnisseau56@gmail.com, jn@beasse.org, juliepannerec@gmail.com, juliepoisson@laposte.net, karim.faure09@gmail.com, kergoet.sabine@gmail.com, kowoulm@hotmail.fr, le.corvec.erell@gmail.com, leandre.mandard@sciencespo.fr, lebozecaurelie@gmail.com, lecam.malo@gmail.com, legrandfaut@orange.fr, maellegroux@hormail.fr, maellegroux@hotmail.fr, maiwenn_d2@hotmail.com, malibellula@hotmail.com, manonguiraud@hotmail.fr, marie.michaux@gmail.com, mariedupretz22@gmail.com, mariemonfort8849@gmail.com, marmouz77@orange.fr, mireilleczi@orange.fr, mm37@gmail.com, mordeles.pauline@gmail.com, morgandavalan@ecomail.bzh, murielle22110@gmail.com, nathalielecam22@gmail.com, nicole.jeannel@mailo.com, nolwenncoail@gmail.com, pascaline.trubuilt@hotmail.fr, ramoneurdukb@gmail.com, remi_onweb@yahoo.fr, roland.le-cam@wanadoo.fr, sabrina.canziani@gmail.com, sabrinalaf@hotmail.fr, stephanielebris@wanadoo.fr, trouboul37@gmail.com, tudal@free.fr, w.adrien@outlook.fr";

const fakeListStr = "pauline.garrigues@free.fr, lecam.valerie@gmail.com, gaelle.le-g@orange.fr, julie.jumeau@gmail.com, cle.leberre@laposte.net, sylvette.dore@orange.fr, laurie.bonnisseau@gmail.com, thierryczi@gmail.com, delphinetartivel22@gmail.com, stephane@peoch.bzh, rocherstephane834@gmail.com, stephane.cadiou4@orange.fr, adeline2294@hotmail.fr, rkermarrec@gmail.com, arno-22110@hotmail.fr, jeanfrancoislecorre@yahoo.fr, contact@collectif-ecole-km.fr, romuald.kergoet@gmail.com, valeriefauchoux@gmail.com, nadege.allain22@gmail.com, paturelles@gmail.com, helenelecorre@yahoo.fr, helenedefos@gmail.com, jeanmichel.peoch@gmail.com, lebozecaurelie@gmail.com, gladys.quemener@gmail.com, leandre.mandard@sciencespo.fr, crombezcamala1@gmail.com, mordeles.pauline@gmail.com, caribot806@gmail.com, ramoneurdukb@gmail.com, trouboul37@gmail.com, remi_onweb@yahoo.fr, lecam.malo@gmail.com, jl.bonnisseau56@gmail.com, murielle22110@gmail.com, kergoet.sabine@gmail.com, anneclaire79@hotmail.fr, axbguv@gmail.com, goliathbouba1@gmail.com, w.adrien@outlook.fr, baptiste.gilbert@hotmail.fr, roland.le-cam@wanadoo.fr, fdvos@me.com, kowoulm@hotmail.fr, clerun61@gmail.com, francoisczi@orange.fr, malibellula@hotmail.com, ch.teinturier@gmail.com, ferriergwenaelle@gmail.com, daniel.perennes@orange.fr, maiwenn_d2@hotmail.com, agone85@gmail.com, goliathbouba1@yahoo.fr, marie.michaux@gmail.com, binouzcaurel@gmail.com, juliepannerec@gmail.com, mm37@gmail.com, sabrina.canziani@gmail.com, morgandavalan@ecomail.bzh, antonin.mestric@gmail.com, mariedupretz22@gmail.com, fanfantanguy22@gmail.com, annemariebourges@outlook.com, didier.teinturier@gmail.com, tudal@free.fr, jeannie.blin@gmail.com, jeffrieju@gmail.com, chasseloup.gladys@gmail.com, alt.nk-2o7lg2up@yopmail.com, bricethomas.adrfaso@gmail.com, adrien.col@laposte.net, juliepoisson@laposte.net, marmouz77@orange.fr, a.e.milan@hotmail.fr, bm_gaia@proton.me, izaude22@gmail.com, maellegroux@hotmail.fr, mireilleczi@orange.fr, evencedum@hotmail.fr, legrandfaut@orange.fr, nathalielecam22@gmail.com, blacknails91@yahoo.fr, annesojean@wanadoo.fr";

const bouncedListStr = `nadege.allain22@gmail.com
laurie.bonnisseau@gmail.com
stephane@peoch.bzh
jeanmichel.peoch@gmail.com
contact@collectif-ecole-km.fr
helenedefos@gmail.com
adeline2294@hotmail.fr
thierryczi@gmail.com
rocherstephane834@gmail.com
delphinetartivel22@gmail.com
romuald.kergoet@gmail.com
mm37@gmail.com
cle.leberre@laposte.net
arno-22110@hotmail.fr
helenelecorre@yahoo.fr
fdvos@me.com
jeanfrancoislecorre@yahoo.fr
pauline.garrigues@free.fr
stephane.cadiou4@orange.fr
sylvette.dore@orange.fr
gaelle.le-g@orange.fr`;

const realList = realListStr.split(',').map(e => e.trim().toLowerCase());
const fakeList = fakeListStr.split(',').map(e => e.trim().toLowerCase());
const bouncedList = bouncedListStr.split('\n').map(e => e.split(' ')[0].trim().toLowerCase()).filter(Boolean);

// Who actually received the email? 
// They must be in the fakeList (which you sent to) AND NOT in the bouncedList (which means they received it successfully).
const successfullyReceived = fakeList.filter(e => !bouncedList.includes(e));

// So who STILL NEEDS the email?
// The Real Members, MINUS the ones who already successfully received it.
const needsEmail = realList.filter(e => !successfullyReceived.includes(e));

console.log("=== SUCCESSFULLY RECEIVED ===");
console.log(successfullyReceived);

console.log("\n=== NEEDS EMAIL (THE DIFF) ===");
console.log(needsEmail.join(', '));
console.log(`\nTotal needs email: ${needsEmail.length}`);
