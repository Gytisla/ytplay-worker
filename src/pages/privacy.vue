<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <section class="relative py-20">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h1 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
          Privatumo politika
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Kaip mes renkame, naudojame ir saugome jūsų duomenis
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Paskutinį kartą atnaujinta: {{ new Date().toLocaleDateString('lt-LT') }}
        </p>
      </div>
    </section>

    <!-- Content Section -->
    <section class="pb-20">
      <div class="max-w-4xl mx-auto px-4">
        <div class="prose prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">1. Įvadas</h2>
            <p class="text-base leading-relaxed mb-6">
              ToPlay.lt ("mes", "mūsų" arba "platforma") įsipareigoja apsaugoti jūsų privatumą.
              Ši privatumo politika paaiškina, kaip mes renkame, naudojame ir saugome informaciją,
              kai naudojatės mūsų svetaine.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">2. Informacija, kurią renkame</h2>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.1. Automatiškai renkama informacija</h3>
              <p class="text-base leading-relaxed mb-4">Mes naudojame Google Analytics, kad suprastume, kaip lankytojai naudojasi mūsų svetaine:</p>
              <ul class="space-y-3 ml-6">
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">IP adresas</strong> - jūsų interneto ryšio identifikatorius</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Naršyklės informacija</strong> - naršyklės tipas, versija ir kalba</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Įrenginio informacija</strong> - įrenginio tipas ir operacinė sistema</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Lankymo duomenys</strong> - puslapiai, kuriuos aplankėte, ir laikas, praleistas svetainėje</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Šaltinio informacija</strong> - kaip patekote į mūsų svetainę (paieškos sistema, nuoroda ir t.t.)</div>
                </li>
              </ul>
            </div>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.2. Slapukai (Cookies)</h3>
              <p class="text-base leading-relaxed mb-4">Mes naudojame šiuos slapukų tipus:</p>
              <ul class="space-y-3 ml-6">
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Būtini slapukai</strong> - reikalingi svetainės veikimui</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Google Analytics slapukai</strong> - statistikos rinkimui (_ga, _gid, _gat)</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Funkciniai slapukai</strong> - kalbos nustatymų išsaugojimui</div>
                </li>
              </ul>
            </div>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.2.1. Kas yra slapukai?</h3>
              <p class="text-base leading-relaxed mb-4">
                Slapukai yra nedideli tekstiniai failai, kurie išsaugomi jūsų įrenginyje (kompiuteryje, telefone ar planšetėje),
                kai lankotės mūsų svetainėje. Jie padeda svetainei atsiminti jūsų nustatymus ir pageidavimus,
                taip pat suteikia informaciją apie tai, kaip naudojatės svetaine.
              </p>
              <p class="text-base leading-relaxed mb-4">
                Slapukai nėra virusai ar kenkėjiška programinė įranga - jie yra saugūs ir negali pakenkti jūsų įrenginiui.
                Jie naudojami daugelyje svetainių, kad pagerinti naudotojų patirtį.
              </p>
            </div>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.2.2. Slapukų tipai pagal paskirtį</h3>

              <div class="mb-6">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Būtini slapukai (Essential Cookies)</h4>
                <p class="text-base leading-relaxed mb-3">
                  Šie slapukai yra absoliučiai reikalingi svetainės pagrindinėms funkcijoms. Be jų svetainė neveiktų tinkamai.
                </p>
                <ul class="space-y-2 ml-4 text-sm">
                  <li>• <strong>Sesijos valdymas</strong> - palaiko jūsų naršymo sesiją</li>
                  <li>• <strong>Saugumas</strong> - apsaugo nuo kenkėjiškų atakų</li>
                  <li>• <strong>Autentifikacija</strong> - išlaiko jūsų prisijungimo būseną</li>
                </ul>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <em>Šių slapukų išjungti negalima, nes jie užtikrina svetainės saugų veikimą.</em>
                </p>
              </div>

              <div class="mb-6">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Analitiniai slapukai (Analytics Cookies)</h4>
                <p class="text-base leading-relaxed mb-3">
                  Šie slapukai padeda mums suprasti, kaip lankytojai naudojasi svetaine, kokie puslapiai yra populiariausi,
                  iš kur ateina lankytojai ir kaip galima pagerinti svetainės veikimą.
                </p>
                <ul class="space-y-2 ml-4 text-sm">
                  <li>• <strong>Google Analytics</strong> - svetainės statistikos rinkimas</li>
                  <li>• <strong>Lankymo duomenys</strong> - puslapiai, laikas, įrenginys</li>
                  <li>• <strong>Anoniminiai duomenys</strong> - neidentifikuoja konkretaus asmens</li>
                </ul>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <em>Šiuos slapukus galite atsisakyti naudodami slapukų nustatymų skydelį.</em>
                </p>
              </div>

              <div class="mb-6">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Funkciniai slapukai (Functional Cookies)</h4>
                <p class="text-base leading-relaxed mb-3">
                  Šie slapukai pagerina svetainės funkcionalumą ir prisitaiko prie jūsų pageidavimų,
                  kad suteiktų geresnę naudotojo patirtį.
                </p>
                <ul class="space-y-2 ml-4 text-sm">
                  <li>• <strong>Kalbos nustatymai</strong> - išsaugo jūsų pasirinktą kalbą</li>
                  <li>• <strong>Temos nustatymai</strong> - išsaugo šviesų/tamsų režimą</li>
                  <li>• <strong>Naudotojo nuostatos</strong> - prisimena jūsų pasirinkimus</li>
                </ul>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <em>Šie slapukai nėra privalomi, bet pagerina svetainės naudojimą.</em>
                </p>
              </div>
            </div>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.2.3. Slapukų galiojimo laikas</h3>
              <ul class="space-y-3 ml-6">
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Sesijos slapukai</strong> - ištrinami uždarius naršyklę</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Nuolatiniai slapukai</strong> - galioja iki 2 metų arba kol ištrinami</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong class="text-gray-900 dark:text-white">Trečiųjų šalių slapukai</strong> - valdomi kitų paslaugų teikėjų</div>
                </li>
              </ul>
            </div>

            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2.3. Ateities duomenų rinkimas</h3>
              <p class="text-base leading-relaxed mb-4">
                Šiuo metu mes nerenkame asmeninių duomenų, tokių kaip vardas, el. paštas ar kiti kontaktiniai duomenys.
                Tačiau ateityje, įdiegus vartotojų registraciją, galime rinkti:
              </p>
              <ul class="space-y-3 ml-6">
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>El. pašto adresą registracijai</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Vartotojo vardą ir slaptažodį</div>
                </li>
                <li class="flex items-start">
                  <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Naudojimosi įpročius ir nustatymus</div>
                </li>
              </ul>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">3. Kaip naudojame informaciją</h2>
            <ul class="space-y-4 ml-6">
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Svetainės tobulinimui</strong> - analizuoti lankytojų elgesį ir pagerinti naudotojo patirtį</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Statistikai</strong> - suprasti, kurie turiniai yra populiarūs</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Techniniam palaikymui</strong> - diagnozuoti problemas ir užtikrinti stabilų veikimą</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Saugumui</strong> - apsaugoti nuo piktnaudžiavimo ir saugoti platformą</div>
              </li>
            </ul>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">4. Duomenų saugumas</h2>
            <p class="text-base leading-relaxed mb-6">
              Mes įgyvendiname tinkamas technines ir organizacines priemones, kad apsaugotume jūsų duomenis:
            </p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>Šifruotas duomenų perdavimas (HTTPS)</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>Saugūs serveriai ir duomenų bazės</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>Reguliarūs saugumo atnaujinimai</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>Apribotas prieigos prie duomenų</div>
              </li>
            </ul>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">5. Duomenų dalijimasis</h2>
            <p class="text-base leading-relaxed mb-6">
              Mes <strong class="text-red-600 dark:text-red-400">nedalijame</strong> jūsų asmeninių duomenų su trečiosiomis šalimis, išskyrus:
            </p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Google Analytics</strong> - statistikos tikslais (anoniminiai duomenys)</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Teisiniai reikalavimai</strong> - jei to reikalauja įstatymai</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Platformos tiekėjai</strong> - serverių ir infrastruktūros paslaugos</div>
              </li>
            </ul>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">6. Jūsų teisės</h2>
            <p class="text-base leading-relaxed mb-6">Jūs turite teisę:</p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Sužinoti</strong> apie renkamus duomenis</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Prašyti ištrynimo</strong> savo duomenų</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Atsisakyti</strong> analitinių slapukų</div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Pateikti skundą</strong> duomenų apsaugos institucijai</div>
              </li>
            </ul>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">7. Slapukų valdymas</h2>
            <p class="text-base leading-relaxed mb-6">
              Galite valdyti slapukus savo naršyklės nustatymuose. Tačiau kai kurių slapukų išjungimas
              gali paveikti svetainės funkcionalumą.
            </p>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1. Mūsų slapukų nustatymų skydelis</h3>
              <p class="text-base leading-relaxed mb-3">
                Pirmą kartą aplankius svetainę, apačioje ekrano pasirodys slapukų sutikimo skydelis.
                Jame galite:
              </p>
              <ul class="space-y-2 ml-6 text-sm">
                <li>• <strong>Priimti visus slapukus</strong> - sutikti su visų tipų slapukų naudojimu</li>
                <li>• <strong>Atmesti visus slapukus</strong> - naudoti tik būtinus slapukus</li>
                <li>• <strong>Tinkinti nustatymus</strong> - pasirinkti, kuriuos slapukus priimti</li>
              </ul>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <em>Jūsų pasirinkimai bus išsaugoti ir galios ateities vizituose.</em>
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2. Naršyklės nustatymai</h3>
              <p class="text-base leading-relaxed mb-3">
                Galite valdyti slapukus savo interneto naršyklėje. Štai kaip tai padaryti populiariausiose naršyklėse:
              </p>

              <div class="grid md:grid-cols-2 gap-4 text-sm">
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong class="text-gray-900 dark:text-white">Google Chrome:</strong>
                  <br>• Nustatymai → Privatumas ir saugumas → Slapukai ir kiti duomenys
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong class="text-gray-900 dark:text-white">Mozilla Firefox:</strong>
                  <br>• Nustatymai → Privatumas ir saugumas → Slapukai ir duomenys
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong class="text-gray-900 dark:text-white">Safari:</strong>
                  <br>• Nuostatos → Privatumas → Valdyti svetainės duomenis
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong class="text-gray-900 dark:text-white">Microsoft Edge:</strong>
                  <br>• Nustatymai → Slapukai ir svetainės leidimai → Slapukai ir duomenys
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3. Išjungus slapukus</h3>
              <p class="text-base leading-relaxed mb-3">
                Išjungus tam tikrus slapukus, gali neveikti šios funkcijos:
              </p>
              <ul class="space-y-2 ml-6 text-sm">
                <li>• <strong>Analitiniai slapukai</strong> - nebus renkama statistika apie svetainės naudojimą</li>
                <li>• <strong>Funkciniai slapukai</strong> - neprisiminsime jūsų kalbos ir temos nustatymų</li>
                <li>• <strong>Būtini slapukai</strong> - svetainė gali neveikti arba veikti netinkamai</li>
              </ul>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4. Slapukų ištrynimas</h3>
              <p class="text-base leading-relaxed mb-3">
                Galite bet kada ištrinti jau išsaugotus slapukus:
              </p>
              <ul class="space-y-2 ml-6 text-sm">
                <li>• Savo naršyklės nustatymuose</li>
                <li>• Naudodami mūsų slapukų nustatymų skydelį</li>
                <li>• Išvalydami naršymo duomenis</li>
              </ul>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <em>Ištrynus slapukus, gali tekti iš naujo nustatyti pageidavimus.</em>
              </p>
            </div>

            <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Keisti slapukų nustatymus</h3>
              <p class="text-base leading-relaxed mb-4">
                Galite bet kada pakeisti savo slapukų nustatymus naudodami mūsų interaktyvų nustatymų skydelį.
                Jūsų pasirinkimai bus išsaugoti ir pritaikyti iš karto.
              </p>
              <button
                @click="openCookieSettings"
                class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Atidaryti slapukų nustatymus
              </button>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">8. Trečiųjų šalių svetainės</h2>
            <p class="text-base leading-relaxed">
              Mūsų svetainėje gali būti nuorodos į kitų svetaines. Mes neatsakome už jų privatumo praktiką.
              Rekomenduojame perskaityti jų privatumo politiką.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">9. Vaikų privatumas</h2>
            <p class="text-base leading-relaxed">
              Mūsų platforma nėra skirta vaikams iki 13 metų. Mes nerenkame sąmoningai informacijos
              iš vaikų iki 13 metų.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">10. Politikos pakeitimai</h2>
            <p class="text-base leading-relaxed">
              Ši privatumo politika gali būti atnaujinta. Apie esminius pakeitimus informuosime
              svetainėje arba el. paštu (kai bus įdiegta registracija).
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">11. Susisiek su mumis</h2>
            <p class="text-base leading-relaxed mb-6">
              Jei turite klausimų apie šią privatumo politiką, susisiek su mumis:
            </p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">El. paštas:</strong> <a href="mailto:info@toplay.lt" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">info@toplay.lt</a></div>
              </li>
              <li class="flex items-start">
                <span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div><strong class="text-gray-900 dark:text-white">Svetainė:</strong> <a href="https://toplay.lt" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300" target="_blank">toplay.lt</a></div>
              </li>
            </ul>
          </div>

          <div class="mt-16 p-8 mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">Google Analytics</h3>
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  Mes naudojame Google Analytics, kad suprastume, kaip lankytojai naudojasi mūsų svetaine.
                  Google Analytics naudoja slapukus duomenų rinkimui.
                </p>
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  Surinkti duomenys perduodami ir saugomi Google serveriuose. Daugiau informacijos
                  apie Google privatumo praktiką rasite:
                </p>
                <a href="https://policies.google.com/privacy" class="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium" target="_blank">
                  Google Privatumo politika
                  <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string }

import { useCookieConsent } from '../composables/useCookieConsent'

const { t } = useI18n()

// Import and use the cookie consent composable
const { openSettings } = useCookieConsent()

const openCookieSettings = () => {
  openSettings()
}

useHead({
  title: t('seo.privacy.title'),
  meta: [
    {
      name: 'description',
      content: t('seo.privacy.description')
    },
    {
      property: 'og:title',
      content: t('seo.privacy.ogTitle')
    },
    {
      property: 'og:description',
      content: t('seo.privacy.ogDescription')
    }
  ]
})
</script>