const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Insert state and fetch
const fetchLogic = `  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const q = query(
          collection(db, 'articles'), 
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sorting manually since ordering requires a composite index on firestore
        fetchedArticles.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        setArticles(fetchedArticles.slice(0, 3));
      } catch (error) {
        console.error('Erreur articles:', error);
      }
    }
    fetchArticles();
  }, []);
`;
code = code.replace('  const [memberCount, setMemberCount] = useState<number>(51); // Valeur par défaut', '  const [memberCount, setMemberCount] = useState<number>(51); // Valeur par défaut\n' + fetchLogic);

// Insert JSX before Charte
const articlesJSX = `
        {/* Actualités Section */}
        {articles.length > 0 && (
          <section className="py-20 bg-white px-4 border-b border-stone-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <Newspaper className="text-emerald-600" />
                    Dernières actualités
                  </h2>
                  <p className="text-stone-600">Suivez les avancées du collectif et les infos sur le projet.</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {articles.map(article => (
                  <a key={article.id} href={\`/actualites/\${article.id}\`} className="group flex flex-col bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 hover:border-emerald-200 hover:shadow-lg transition-all">
                    {article.imageUrl ? (
                      <div className="h-48 overflow-hidden">
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-48 bg-stone-200 flex items-center justify-center text-stone-400">
                        <Newspaper size={48} opacity={0.5} />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-sm font-bold text-emerald-600 mb-2">
                        {new Date(article.publishedAt || Date.now()).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-stone-600 group-hover:text-emerald-600 transition-colors pt-4 border-t border-stone-200">
                        Lire l'article <ChevronRight size={16} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
`;

code = code.replace('{/* Charte Section */}', articlesJSX + '\n        {/* Charte Section */}');
fs.writeFileSync('app/page.tsx', code);
