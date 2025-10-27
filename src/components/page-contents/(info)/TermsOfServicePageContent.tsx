import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TermsOfServicePageContent = ({ project }: { project: "retreats" | "workshops" }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:py-12 sm:px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center mb-6 pt-4">
            Regulamin korzystania z serwisu{" "}
            {project === "retreats" ? "wyjazdy.yoga" : "wydarzenia.yoga"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-gray-700 dark:text-gray-300">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">1. Postanowienia ogólne</h2>
            <p className="mb-4">
              1.1. Niniejszy regulamin (&quot;Regulamin&quot;) określa zasady korzystania z serwisu
              internetowego{" "}
              <strong>{project === "retreats" ? "wyjazdy.yoga" : "wydarzenia.yoga"}</strong>{" "}
              (&quot;Serwis&quot;).
            </p>
            <p className="mb-4">
              1.2. Operatorem Serwisu jest [dane podmiotu zostaną uzupełnione po rejestracji firmy].
            </p>
            <p className="mb-4">
              1.3. Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">2. Zakres usług</h2>
            <p className="mb-4">
              2.1. Serwis udostępnia platformę do publikacji i wyszukiwania wydarzeń związanych z
              jogą, takich jak warsztaty, kursy, wyjazdy, festiwale i inne wydarzenia.
            </p>
            <p className="mb-4">
              2.2. Serwis nie pośredniczy w płatnościach ani w rozliczeniach pomiędzy użytkownikami
              a organizatorami wydarzeń.
            </p>
            <p className="mb-4">
              2.3. Wszelkie warunki uczestnictwa, w tym ceny, polityka anulacji, harmonogram
              płatności i inne zasady, ustalane są wyłącznie przez organizatorów wydarzeń.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">3. Rejestracja i logowanie</h2>
            <p className="mb-4">
              3.1. Organizatorzy mogą publikować wydarzenia po rejestracji i zalogowaniu do Serwisu.
            </p>
            <p className="mb-4">
              3.2. Logowanie może odbywać się za pośrednictwem usług zewnętrznych (np. Google,
              Facebook).
            </p>
            <p className="mb-4">
              3.3. Użytkownik zobowiązany jest do podania prawdziwych danych podczas rejestracji i
              logowania.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">4. Treści użytkowników</h2>
            <p className="mb-4">
              4.1. Użytkownicy i organizatorzy ponoszą pełną odpowiedzialność za treści publikowane
              w Serwisie (opisy, zdjęcia, recenzje, komentarze).
            </p>
            <p className="mb-4">
              4.2. Publikując treści, użytkownik oświadcza, że posiada do nich wszelkie prawa oraz
              udziela Operatorowi Serwisu niewyłącznej, bezterminowej, nieodpłatnej licencji na ich
              używanie w zakresie niezbędnym do funkcjonowania Serwisu (m.in. wyświetlanie,
              kopiowanie, tłumaczenie, promocja).
            </p>
            <p className="mb-4">4.3. Zabronione jest publikowanie treści:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
              <li>naruszających prawo, dobra osobiste lub prawa autorskie osób trzecich,</li>
              <li>
                zawierających elementy obraźliwe, nieprzyzwoite lub niezgodne z dobrymi obyczajami,
              </li>
              <li>stanowiących spam, reklamy niezwiązane z wydarzeniami jogowymi,</li>
              <li>zawierających wirusy lub inne szkodliwe kody.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">5. Odpowiedzialność</h2>
            <p className="mb-4">5.1. Operator Serwisu nie ponosi odpowiedzialności za:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
              <li>
                prawdziwość i aktualność treści publikowanych przez użytkowników i organizatorów,
              </li>
              <li>przebieg, jakość i realizację wydarzeń,</li>
              <li>ewentualne szkody powstałe w związku z uczestnictwem w wydarzeniu,</li>
              <li>
                kwestie finansowe, rozliczenia i ubezpieczenia – które pozostają wyłącznie w gestii
                organizatorów i uczestników.
              </li>
            </ul>
            <p className="mb-4">
              5.2. Użytkownik uczestniczy w wydarzeniu na własne ryzyko i odpowiedzialność.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">6. Polityka anulacji</h2>
            <p className="mb-4">
              6.1. Każdy organizator określa własną politykę anulacji i zwrotów.
            </p>
            <p className="mb-4">
              6.2. Serwis nie pośredniczy w procesie zwrotów ani nie odpowiada za ich realizację.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">7. Niedozwolone działania</h2>
            <p className="mb-4">
              7.1. Zakazane jest wykorzystywanie Serwisu w sposób sprzeczny z prawem lub
              Regulaminem, w szczególności:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
              <li>omijanie zasad publikacji,</li>
              <li>zbieranie danych osobowych innych użytkowników bez ich zgody,</li>
              <li>próby zakłócenia działania Serwisu (np. hacking, scraping).</li>
            </ul>
            <p className="mb-4">
              7.2. Naruszenie postanowień Regulaminu może skutkować blokadą konta użytkownika lub
              usunięciem treści.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">8. Reklamacje i kontakt</h2>
            <p className="mb-4">
              8.1. Wszelkie pytania i zgłoszenia dotyczące funkcjonowania Serwisu można kierować na
              adres: [adres e-mail do uzupełnienia].
            </p>
            <p className="mb-4">
              8.2. Operator rozpatruje reklamacje w terminie 30 dni od ich otrzymania.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">9. Zmiany Regulaminu</h2>
            <p className="mb-4">
              9.1. Operator zastrzega sobie prawo do zmiany Regulaminu w dowolnym czasie.
            </p>
            <p className="mb-4">
              9.2. Zmiany wchodzą w życie z chwilą opublikowania na stronie Serwisu.
            </p>
            <p className="mb-4">
              9.3. Dalsze korzystanie z Serwisu po zmianach oznacza ich akceptację.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">10. Prawo właściwe</h2>
            <p className="mb-4">10.1. Do niniejszego Regulaminu stosuje się prawo polskie.</p>
            <p className="mb-4">
              10.2. Wszelkie spory będą rozstrzygane przez właściwe sądy powszechne w Polsce.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
