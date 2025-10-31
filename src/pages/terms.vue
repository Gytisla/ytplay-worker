<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <section class="relative py-20">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h1 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
          Naudojimo sąlygos
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Svetainės naudojimo taisyklės ir sąlygos
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
              Šios naudojimo sąlygos ("Sąlygos") reglamentuoja jūsų naudojimąsi ToPlay.lt svetaine ("Platforma" arba "Svetainė").
              Naudodamiesi mūsų svetaine, jūs sutinkate laikytis šių sąlygų.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">2. Paslaugos aprašymas</h2>
            <p class="text-base leading-relaxed mb-6">
              ToPlay.lt yra informacinė platforma, kuri teikia informaciją apie YouTube vaizdo įrašus ir kanalus.
              Mes naudojame viešai prieinamus duomenis ir API, kad suteiktume naudotojams galimybę atrasti ir tyrinėti YouTube turinį.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">3. Svarbus teisinis pranešimas apie YouTube</h2>

            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                            <div class="space-y-0">
                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                  <p class="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                    <strong>ToPlay.lt nėra susijusi, priklausanti arba kontroliuojama Google LLC arba YouTube.</strong>
                    Mes nesame YouTube partneriai, filialai, atstovai arba bet kokiu kitu būdu susiję su YouTube platforma.
                  </p>
                </div>

                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                  <p class="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                    <strong>Mes naudojame YouTube Data API v3</strong> tik viešai prieinamiems duomenims gauti pagal Google nustatytas API naudojimo taisykles.
                    Visi duomenys yra gaunami teisėtai ir laikantis Google API naudojimo sąlygų.
                  </p>
                </div>

                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                  <p class="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                    <strong>YouTube® yra Google LLC registruotas prekių ženklas.</strong>
                    Šioje svetainėje naudojami terminai "YouTube" ir "YouTube vaizdo įrašai" yra tik informaciniais tikslais ir nenurodo jokio ryšio ar priklausomybės.
                  </p>
                </div>

                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                  <p class="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                    <strong>Mes neteikiame, nekuriame ir neplatiname YouTube vaizdo įrašų.</strong>
                    Visi vaizdo įrašai priklauso jų atitinkamiems autoriams ir yra prieinami tik per oficialią YouTube platformą.
                  </p>
                </div>

                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                  <p class="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                    <strong>Mes neatsakome už YouTube turinio kokybę, tikslumą ar teisėtumą.</strong>
                    Bet koks turinys, kurį galima pasiekti per mūsų platformą, yra YouTube atsakomybė.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">4. Naudojimo taisyklės</h2>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.1. Leidžiamas naudojimas</h3>
              <p class="text-base leading-relaxed mb-3">Jūs galite naudotis mūsų platforma:</p>
              <ul class="space-y-2 ml-6">
                <li>• Peržiūrėti viešai prieinamus YouTube vaizdo įrašų duomenis</li>
                <li>• Ieškoti ir atrasti turinį pagal temas ir kanalus</li>
                <li>• Naudotis svetaine asmeninėms, nekomercinėms reikmėms</li>
                <li>• Dalintis nuorodomis į mūsų platformą</li>
              </ul>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.2. Draudžiamas naudojimas</h3>
              <p class="text-base leading-relaxed mb-3">Jūs negalite:</p>
              <ul class="space-y-2 ml-6">
                <li>• Naudotis platforma komerciniais tikslais be raštiško sutikimo</li>
                <li>• Automatiškai rinkti duomenis (scraping, crawling)</li>
                <li>• Bandyti apeiti saugumo sistemas ar API limitus</li>
                <li>• Platinti kenksmingą programinę įrangą ar virusus</li>
                <li>• Pažeisti intelektinės nuosavybės teises</li>
                <li>• Naudotis platforma neteisėtai ar žalingai</li>
              </ul>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">5. API naudojimo sąlygos</h2>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.1. YouTube Data API</h3>
              <p class="text-base leading-relaxed mb-4">
                Mes naudojame YouTube Data API v3 pagal Google nustatytas Developer Policies ir Terms of Service.
                Visi API užklausos yra ribojamos pagal Google nustatytus limitus ir taisykles.
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.2. Duomenų tikslumas</h3>
              <p class="text-base leading-relaxed mb-4">
                Informacija apie YouTube vaizdo įrašus ir kanalus yra gaunama realiu laiku iš YouTube API.
                Mes negarantuojame duomenų tikslumo ar išsamumo, nes jie priklauso nuo YouTube pateikiamų duomenų.
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.3. API limitai</h3>
              <p class="text-base leading-relaxed mb-4">
                Dėl YouTube API limitų, kai kuriais atvejais duomenys gali būti neprieinami arba uždelsti.
                Tai nėra mūsų kaltė ir mes neatsakome už tokius atvejus.
              </p>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">6. Intelektinė nuosavybė</h2>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">6.1. Mūsų turinys</h3>
              <p class="text-base leading-relaxed mb-4">
                Visa mūsų svetainės programinė įranga, dizainas ir funkcionalumas yra mūsų nuosavybė arba naudojami pagal licenciją.
                Jūs negalite kopijuoti, modifikuoti ar platinti mūsų turinio be raštiško sutikimo.
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">6.2. YouTube turinys</h3>
              <p class="text-base leading-relaxed mb-4">
                Visi YouTube vaizdo įrašai, kanalai ir kitas turinys priklauso jų atitinkamiems autoriams.
                Mes neteikiame jokių teisių į šį turinį ir neatsakome už jo naudojimą.
              </p>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">7. Atsakomybės apribojimas</h2>

            <div class="space-y-4">
              <p class="text-base leading-relaxed">
                <strong>Mūsų platforma teikiama "tokia, kokia yra" be jokių garantijų.</strong>
                Mes neatsakome už:
              </p>

              <ul class="space-y-2 ml-6">
                <li>• YouTube API neprieinamumą ar gedimus</li>
                <li>• Duomenų netikslumą ar neišsamumą</li>
                <li>• Trečiųjų šalių svetainių turinį ar veikimą</li>
                <li>• Bet kokius tiesioginius ar netiesioginius nuostolius</li>
                <li>• Duomenų praradimą ar saugumo pažeidimus</li>
              </ul>

              <p class="text-base leading-relaxed mt-4">
                <strong>Mes aiškiai pareiškiame, kad nesame susiję su YouTube ar Google</strong>
                ir neatsakome už jų paslaugų veikimą, turinį ar politiką.
              </p>
            </div>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">8. Privatumas ir slapukai</h2>
            <p class="text-base leading-relaxed mb-4">
              Jūsų privatumas mums svarbus. Išsami informacija apie tai, kaip renkame ir naudojame duomenis,
              pateikta mūsų <NuxtLink to="/privacy" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline">Privatumo politikoje</NuxtLink>.
            </p>
            <p class="text-base leading-relaxed">
              Naudodamiesi mūsų platforma, jūs sutinkate su mūsų slapukų politika,
              kurią galite valdyti bet kuriuo metu.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">9. Sąlygų pakeitimai</h2>
            <p class="text-base leading-relaxed mb-4">
              Mes pasiliekame teisę bet kuriuo metu pakeisti šias naudojimo sąlygas.
              Apie esminius pakeitimus informuosime svetainėje arba el. paštu.
            </p>
            <p class="text-base leading-relaxed">
              Toliau naudodamiesi platforma po pakeitimų, jūs sutinkate su naujomis sąlygomis.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">10. Taikoma teisė</h2>
            <p class="text-base leading-relaxed mb-4">
              Šios sąlygos yra reglamentuojamos Lietuvos Respublikos įstatymų.
              Bet kokie ginčai bus sprendžiami Lietuvos teismuose.
            </p>
          </div>

          <div class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">11. Susisiek su mumis</h2>
            <p class="text-base leading-relaxed mb-6">
              Jei turite klausimų apie šias naudojimo sąlygas, susisiek su mumis:
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

          <div class="mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Svarbus pranešimas apie YouTube</h3>
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  ToPlay.lt yra nepriklausoma platforma, kuri nenaudoja, nekopijuoja ar neplatiną YouTube vaizdo įrašų.
                  Mes tik teikiame informaciją apie viešai prieinamą turinį pagal YouTube Data API naudojimo taisykles.
                </p>
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  <strong>Jei norite žiūrėti vaizdo įrašus, visada eik į oficialią YouTube svetainę.</strong>
                  Mes nesame atsakingi už turinio peržiūrą ar atsisiuntimą.
                </p>
                <div class="flex items-center space-x-4">
                  <a href="https://www.youtube.com" class="inline-flex items-center text-red-600 hover:text-red-700 font-medium" target="_blank">
                    Eiti į YouTube
                    <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </a>
                  <NuxtLink to="/privacy" class="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                    Privatumo politika
                    <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// make TS happy in this file for useHead (Nuxt auto-import may already provide it)
declare const useHead: any

useHead({
  title: 'Naudojimo sąlygos | ToPlay.lt',
  meta: [
    {
      name: 'description',
      content: 'ToPlay.lt naudojimo sąlygos. Sužinok apie mūsų paslaugas, API naudojimą ir teisines sąlygas.'
    },
    {
      property: 'og:title',
      content: 'Naudojimo sąlygos | ToPlay.lt'
    },
    {
      property: 'og:description',
      content: 'ToPlay.lt naudojimo sąlygos ir taisyklės. Mes naudojame YouTube API, bet nesame susiję su YouTube.'
    }
  ]
})
</script>