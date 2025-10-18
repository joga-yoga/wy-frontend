import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:py-12 sm:px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center mb-6 pt-4">
            Polityka Prywatności wyjazdy.yoga
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-gray-700 dark:text-gray-300">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">JAKIE INFORMACJE ZBIERAMY</h2>
            <p className="mb-4">
              Kiedy odwiedzasz stronę wyjazdy.yoga, automatycznie zbieramy pewne informacje o Twoim
              urządzeniu, w tym o przeglądarce, adresie IP, strefie czasowej oraz niektórych plikach
              cookies zainstalowanych na Twoim urządzeniu. Podczas przeglądania strony zbieramy
              także informacje o poszczególnych stronach lub wydarzeniach, które przeglądasz,
              stronach internetowych lub frazach wyszukiwania, które skierowały Cię na naszą stronę
              oraz o Twojej interakcji ze stroną. Informacje te nazywamy „Informacjami o
              Urządzeniu”.
            </p>
            <p className="mb-4">Zbieramy Informacje o Urządzeniu używając:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
              <li>
                „Cookies”, które są plikami danych umieszczanymi na urządzeniu użytkownika.
                Szczegółowe informacje o cookies oraz sposobie ich wyłączania znajdziesz na stronie:{" "}
                <a
                  href="http://www.allaboutcookies.org"
                  className="text-blue-600 hover:underline break-words"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://www.allaboutcookies.org
                </a>
                .
              </li>
              <li>
                „Pliki dziennika” (log files), które śledzą działania na stronie, zbierając dane
                takie jak adres IP, typ przeglądarki, dostawcę usług internetowych, strony
                odsyłające, strony wyjścia oraz datę i godzinę.
              </li>
              <li>
                „Web beacons”, „tagi” i „pixele”, czyli elektroniczne pliki używane do rejestrowania
                informacji o przeglądaniu strony.
              </li>
            </ul>
            <p className="mb-4">
              Gdy dokonujesz zakupu lub próbujesz dokonać zakupu przez naszą stronę, zbieramy od
              Ciebie dodatkowe dane, takie jak imię i nazwisko, adres do faktury, adres wysyłki,
              dane płatności (w tym numer karty kredytowej), adres email oraz numer telefonu.
              Informacje te określamy jako „Informacje o Zamówieniu”.
            </p>
            <p className="mb-4">
              Email marketing (opcjonalnie): Za Twoją zgodą możemy przesyłać Ci wiadomości o naszych
              usługach, nowych wydarzeniach i innych aktualizacjach.
            </p>
            <p className="mb-4">
              Mówiąc o „Danych Osobowych” w tej Polityce Prywatności, mamy na myśli zarówno
              Informacje o Urządzeniu, jak i Informacje o Zamówieniu.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              1. JAK WYKORZYSTUJEMY TWOJE DANE OSOBOWE
            </h2>
            <p className="mb-4">
              Informacje o Zamówieniu wykorzystujemy do realizacji zamówień dokonanych przez stronę,
              przetwarzania płatności, organizacji wydarzenia oraz dostarczania faktur i
              potwierdzeń. Komunikujemy się z Tobą, aby identyfikować potencjalne ryzyko lub
              oszustwo oraz dostarczać istotne informacje lub reklamy związane z naszymi produktami
              i usługami.
            </p>
            <p className="mb-4">
              Informacje o Urządzeniu pomagają nam wykrywać ryzyko i oszustwa (w szczególności adres
              IP), poprawiać i optymalizować naszą stronę, generować analizy interakcji użytkowników
              oraz oceniać skuteczność kampanii marketingowych.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              2. UDOSTĘPNIANIE DANYCH OSOBOWYCH
            </h2>
            <p className="mb-4">
              Twoje Dane Osobowe udostępniamy wybranym stronom trzecim, aby pomóc nam w realizacji
              celów opisanych powyżej. Przykłady to firmy zajmujące się backupem danych, dostawcy
              usług emailowych, Stripe dla obsługi płatności (szczegóły polityki prywatności Stripe:{" "}
              <a
                href="https://stripe.com/us/privacy#personal-data-definition"
                className="text-blue-600 hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://stripe.com/us/privacy#personal-data-definition
              </a>
              ), oraz Google Analytics do analizowania korzystania ze strony (więcej informacji
              tutaj:{" "}
              <a
                href="https://www.google.com/intl/pl/policies/privacy/"
                className="text-blue-600 hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.google.com/intl/pl/policies/privacy/
              </a>
              ). Możesz zrezygnować z Google Analytics tutaj:{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-blue-600 hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://tools.google.com/dlpage/gaoptout
              </a>
              .
            </p>
            <p className="mb-4">
              Możemy również udostępniać Twoje Dane Osobowe, aby spełnić obowiązujące przepisy prawa
              lub odpowiedzieć na wezwanie sądowe, nakaz przeszukania lub inne uzasadnione żądanie.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">3. REKLAMA UKIERUNKOWANA</h2>
            <p className="mb-4">
              Więcej informacji o reklamie ukierunkowanej znajdziesz na stronie Network Advertising
              Initiative („NAI”):{" "}
              <a
                href="https://www.networkadvertising.org/understanding-online-advertising/how-does-it-work"
                className="text-blue-600 hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.networkadvertising.org/understanding-online-advertising/how-does-it-work
              </a>
              . Możesz z niej zrezygnować:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
              <li>
                FACEBOOK -{" "}
                <a
                  href="https://www.facebook.com/settings/?tab=ads"
                  className="text-blue-600 hover:underline break-words"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.facebook.com/settings/?tab=ads
                </a>
              </li>
              <li>
                GOOGLE -{" "}
                <a
                  href="https://www.google.com/settings/ads/anonymous"
                  className="text-blue-600 hover:underline break-words"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.google.com/settings/ads/anonymous
                </a>
              </li>
              <li>
                BING -{" "}
                <a
                  href="https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads"
                  className="text-blue-600 hover:underline break-words"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">4. TWOJE PRAWA (RODO)</h2>
            <p className="mb-4">
              Jeśli jesteś rezydentem Unii Europejskiej, masz prawo do dostępu, poprawienia,
              aktualizacji lub usunięcia swoich danych osobowych. Jeśli chcesz skorzystać z tych
              praw, skontaktuj się z nami za pomocą danych kontaktowych poniżej.
            </p>
            <p className="mb-4">
              Dodatkowo informujemy, że Twoje dane osobowe będą przetwarzane zgodnie z zawartymi
              umowami (np. zamówienia) lub na podstawie naszych uzasadnionych interesów biznesowych.
              Twoje dane są przechowywane i przetwarzane wyłącznie na terenie Europejskiego Obszaru
              Gospodarczego (EOG). Nie przekazujemy danych osobowych poza EOG. W przypadku
              konieczności przekazania danych do krajów trzecich w przyszłości, zapewnimy
              odpowiednie zabezpieczenia zgodne z przepisami RODO, takie jak Standardowe Klauzule
              Umowne zatwierdzone przez Komisję Europejską lub inne mechanizmy zgodne z prawem UE. O
              każdej zmianie w zakresie przetwarzania danych osobowych zostaniesz poinformowany z
              odpowiednim wyprzedzeniem.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">5. PRZECHOWYWANIE DANYCH</h2>
            <p className="mb-4">
              Twoje Informacje o Zamówieniu przechowujemy, chyba że poprosisz nas o ich usunięcie.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">6. BEZPIECZEŃSTWO</h2>
            <p className="mb-4">
              Aby chronić Twoje dane osobowe, stosujemy rozsądne środki ostrożności zgodne z
              najlepszymi praktykami branżowymi. Informacje o karcie kredytowej są szyfrowane za
              pomocą technologii SSL i przechowywane z szyfrowaniem AES-256.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">7. WIEK ZGODY</h2>
            <p className="mb-4">
              Korzystając z naszej strony, oświadczasz, że masz co najmniej 18 lat lub jesteś
              pełnoletni w miejscu swojego zamieszkania i wyrażasz zgodę na korzystanie ze strony
              przez osoby niepełnoletnie, za które jesteś odpowiedzialny.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">8. ZMIANY</h2>
            <p className="mb-4">
              Możemy okresowo aktualizować tę politykę prywatności. Zachęcamy do regularnego
              sprawdzania zmian.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">9. KONTAKT</h2>
            <p className="mb-4">
              Więcej informacji o naszej polityce prywatności, pytania lub reklamacje prosimy
              kierować na adres email:{" "}
              <a
                href="mailto:hello@wyjazdy.yoga"
                className="text-blue-600 hover:underline break-words"
              >
                hello@wyjazdy.yoga
              </a>{" "}
              lub pocztą na adres: SVYATOSLAV BORYSENKO, ul. Liściasta 12, Polska.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
