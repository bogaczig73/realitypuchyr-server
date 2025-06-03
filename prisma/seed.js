const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const reviews = [
  {
    name: "Lo Scalzo Monika",
    description: "S Archer reality a hlavně s panem Puchýřem jsem byla spokojená. Byt mě prodal velmi rychle a bez problémů. Se vším ochotně poradil, na mé požadavky reagoval vždy rychle a připraveně. Pokud budu v budoucnu potřebovat služby realitní kanceláře, obrátím se opět na pana Puchýře.",
    rating: 5,
    createdAt: new Date("2024-12-16")
  },
  {
    name: "Andrea Hiršl",
    description: "Na základě rozhodnutí prodeje našeho rodinného domu jsme oslovili Pavla Puchýře a Archer-reality a bylo to jedno z našich nejlepších rozhodnutí. Shodou okolností soused prodával nemovitost a měli jsme srovnání a za nás nesrovnatelné služby od p. Puchýře. Prohlídky, komunikace, jednání s klienty, právní servis i stěhovací služby.",
    rating: 5,
    createdAt: new Date("2024-09-27")
  },
  {
    name: "Jan Chvojka",
    description: "Super makléř",
    rating: 5,
    createdAt: new Date("2024-06-26")
  },
  {
    name: "Stanislav Samek",
    description: "Dobrý den, když potřebuji prodat či jen poradit, pan Puchýř je ten pravý, profesionální, rychlý a vždy připravený řešit složité situace. Závěrem bych rád panu Puchýřovi poděkoval za skvěle odvedenou práci.",
    rating: 5,
    createdAt: new Date("2024-02-07")
  },
  {
    name: "Alena Kukrechtová",
    description: "Vše proběhlo OK, makléř pan Puchýř byl velmi nápomocný při řešení veškerých záležitostí spojených s prodejem i převodem nemovitosti.",
    rating: 5,
    createdAt: new Date("2024-01-25")
  },
  {
    name: "Jiří Nekovař",
    description: "Touto recenzí bych rád poděkoval za zprostředkování prodeje rodinného domu – realitní kanceláři v zastoupení panem Puchýřem Pavlem. Výborná komunikace a zpětná vazba. Profesionální přístup při řešení formalit spojené s prodejem. Vše proběhlo podle mých představ a realitní kanceláři tímto velmi děkuji a všem vřele doporučuji.",
    rating: 5,
    createdAt: new Date("2024-10-19")
  },
  {
    name: "Gabriela Benetková",
    description: "Profesionální přístup. Vše proběhlo hladce. Absolutní spokojenost.",
    rating: 5,
    createdAt: new Date("2024-07-23")
  },
  {
    name: "Martin Svoboda",
    description: "Prodal jsem přes ARCHER reality a hlavně přes pana Puchýře jako makléře svůj pozemek. Přístup pana Puchýře a celého jeho týmu byl skvělý a jsem jim moc vděčný za pomoc a trpělivost.",
    rating: 5,
    createdAt: new Date("2024-05-17")
  },
  {
    name: "Petr Toman",
    description: "Makléř pan Pavel Puchýř nám pomohl zrealizovat prodej domu v Brandýse nad Labem, veškerá spolupráce probíhala na vysoce profesionální úrovní, vše proběhlo rychle a hladce bez jakýkoliv problémů. Chtěl bych tímto vyjádřit uznání za lidský, ale zároveň profesionální přístup celému kolektivu realitní kanceláře ARCHER a současně poděkovat za veškeré služby.",
    rating: 5,
    createdAt: new Date("2024-02-13")
  },
  {
    name: "Vladimír Samanchuk",
    description: "Byli jsme velice spokojeni spolupráci s p. Puchyřem a profesionálním jednáním ze strany RK Archer reality",
    rating: 5,
    createdAt: new Date("2021-11-07")
  },
  {
    name: "Boris Petkov",
    description: "Skvělá a rychlá práce. Pan Puchýř je hezký profesionál, byl vždycky k dispozici pro všechno.",
    rating: 5,
    createdAt: new Date("2023-11-15")
  },
  {
    name: "Lucie Štroblová",
    description: "Děkuji panu Pavlu Puchýřovi za skvělou spolupráci, oceňuji rychlé jednání, ochotu a pozitivní přístup při realizaci obchodu, vše proběhlo rychle a bez problémů. Realitní kanceláři přeji mnoho dalších spokojených klientů.",
    rating: 5,
    createdAt: new Date("2021-06-15")
  },
  {
    name: "Jiří Panoš",
    description: "Přes společnost Archer (a konkrétně přes makléře Pavla Puchýře) jsme realizovali prodej našeho bytu na pražských Stodůlkách. Spolupráci s makléřem hodnotím velmi pozitivně, dostalo se nám profesionálního a zároveň velmi osobního přístupu. Rovněž si velmi vážím spolehlivosti pana Puchýře, vše, na čem jsme se byť třeba jen ústně dohodli, bylo vždy včas a korektně dodrženo. Poskytnuté služby byly rovněž na výborné úrovni a to včetně webového inzerátu a reklamy, nafocení a 3D skenu nemovitosti, banneru a konzultace ohledně nastavení vhodné nabídkové ceny. Samotná administrace prodeje proběhla rovněž bez problémů, vše bylo zajištěno a splněno v termínu. Realitní kancelář i makléře Pavla Puchýře tak mohu vřele doporučit.",
    rating: 5,
    createdAt: new Date("2022-11-26")
  },
  {
    name: "Jan Zemánek",
    description: "S prací pana Pavla Puchýře jsem byl více než spokojen. Chtěl bych Vám poděkovat za profesionalitu, pravidelné informace o aktuálním stavu prodeje a rychlé vyřízení bez komplikací. Děkuji za spolupráci a přeji hodně úspěchů do budoucna",
    rating: 5,
    createdAt: new Date("2020-04-03")
  },
  {
    name: "Jednání pana Puchýře bylo plně profesionální",
    description: "Děkuji moc za zprostředkování koupě stavebního pozemku. Vše proběhlo rychle a bez jakýchkoliv problému, jednání makléře pana Puchýře i pana Lukáče bylo plně profesionální, všechny nejasnosti mi byly vždy rychle vysvětleny. Takže realitní kancelář ARCHER reality Praha mohu doporučit.",
    rating: 5,
    createdAt: new Date()
  },
  {
    name: "Veronika Kameníková",
    description: "Velmi děkuji za pomoc s prodejem bytu. Vysoké nasazení, pohotovost a důslednost a práce nad rámec standardní činnosti obvyklých RK. Vážím si vstřícnosti a empatie pana Puchýře - mimo 100% profesionality. Doporučila bych tuto RK každému, kdo tyto služby potřebuje.",
    rating: 5,
    createdAt: new Date("2020-08-07")
  },
  {
    name: "Všechny procesy byly 100%",
    description: "V této firmě jsem jednala s panem Pavlem Puchýřem. Jednání bylo na profesionální úrovni a hlavně v dněšní době, platílo vše co jsme si domluvili. Což bohužel, již není standard. Odhadovaný termín prodeje byl cca do 3 měsíců, což se nepovedlo, díky našemu otalení podepsat exklusivni smlouvu. Příště bych tuto chybu neuděla a šla bych do ní hned. Poté se již zájemci střídali na prohlídkách. Všechny procesy byly 100%. Děkujeme Pazourková",
    rating: 5,
    createdAt: new Date()
  },
  {
    name: "Jiří Mareš",
    description: "Děkuji panu Puchýřovi za zprostředkování koupě bytu. Vše proběhlo bez problémů a podle našich požadavků",
    rating: 5,
    createdAt: new Date("2020-08-05")
  },
  {
    name: "Stanislav Samek",
    description: "Děkuji tímto panu Puchýřovi za prodej chaty. Naprosto profesionální přístup, který už se bohužel moc často nevidí. Všem kteří se rozhodují komu svěří nemovitost, vřele doporučuji. Ještě jednou velké díky . S pozdravem Samek",
    rating: 5,
    createdAt: new Date("2022-08-31")
  },
  {
    name: "Petr Kučera",
    description: "Původně jsme si byt chtěli prodat sami, ale pan Puchýř mě přesvědčil, abych mu dal šanci nemovitosti nabídnout jejich klientům. Kupec se našel velmi rychle. Celá komunikace byla transparentní pro všechny. Pan Puchýř je velmi spolehlivý, nemám co bych vytknul.",
    rating: 5,
    createdAt: new Date("2022-01-08")
  },
  {
    name: "Perfektní servis",
    description: "Realitní společnost s opravdovým zájmem o klienty a spolupráci s nimi. Absolutně se nedá porovnat spolupráce s nimi a různými \"známými\" realitkami. Makléři z této realitní společnosti s Vámi ochotně komunikují, pomáhají a zkrátka se jedná o perfektní servis.",
    rating: 5,
    createdAt: new Date()
  },
  {
    name: "Pana Puchýře reality prostě baví",
    description: "Začnu, tak jako většina z nás, nechtěla jsem prodávat přes RK, ale ozývaly se pouze RK. Mezi nimi i Archer, o které jsem nikdy předtím neslyšela a díky přístupu pana Puchýře jsem celý svůj záměr přehodnotila. Žádné nucení, žádné přemlouvání, žádné vychloubání, pouze profesionální, reálný a lidský přístup se zájmem o věc. PS: pan Puchýř není žádný puchýř, ale makléř, jehož prostě reality baví.. :)",
    rating: 5,
    createdAt: new Date()
  },
  {
    name: "Alena Šaková",
    description: "Děkuji panu Puchýřovi za rychlý a bezproblémový prodej našeho bytu. Vše na profesionální úrovni, mohu jen doporučit. Přeji ještě mnoho dalších spokojených klientů. Šaková Alena",
    rating: 5,
    createdAt: new Date("2023-02-17")
  },
  {
    name: "Jiří Sixta",
    description: "Oceňuji nasazení a profesionalitu pana Puchýře při hledání vhodného kupce na pozemek i flexibilitu jeho i jeho spolupracovníků v době koronavirového shut-downu.",
    rating: 5,
    createdAt: new Date("2020-07-03")
  },
  {
    name: "Marcel Hrubant",
    description: "Děkujeme za kompletní služby vaší společnosti Archer reality Praha. Makléři, panu Pavlu Puchýřovi děkujeme za profesionální a osobní přístup. Skvěle odvedená práce!!! Přejeme další, stejně spokojené zákazníky.",
    rating: 5,
    createdAt: new Date("2020-09-29")
  },
  {
    name: "Simona Mádlová",
    description: "Pan Pavel Puchýř je tzv. lidský profesionál. Ve smyslu, že je výborným realitním makléřem a jako bonus je jeho neskutečně lidské a férové jednání. Až do první schůzky s panem Puchýřem jsem si byla jista, že realitku nepotřebuji. Dnes jsem panu Puchýřovi velmi vděčna za jeho odvedenou práci a za vřelý přístup. Kdybych měla doporučit někomu z rodiny nebo přátel realitního makléře, volba by byla jasná. Je to Pavel Puchýř. Díky za vše, pane Pavle!",
    rating: 5,
    createdAt: new Date("2021-05-16")
  },
  {
    name: "Odborník ve svém oboru",
    description: "S panem Pavlem Puchýřem byla spolupráce velmi příjemná. Profesionální jednání, výborná komunikace, informoval o všech krocích, které učinil. Prodej našeho bytu proběhl velmi rychle. Měl na starosti i prodej dvou bytů našeho syna a prodat 3 byty ve stejné lokalitě v krátkém čase, aby jsme mohli koupit dvougenerační rodinný dům dokazuje, že je odborníkem ve svém oboru. Archer reality vřele doporučujeme všem zájemcům. Čermákovi",
    rating: 5,
    createdAt: new Date()
  },
  {
    name: "Kateřina Pajskrová",
    description: "S koupi bytu s Archer reality a se spoluprací pana Puchýře jsme byli spokojeni.",
    rating: 5,
    createdAt: new Date("2021-11-21")
  },
  {
    name: "Pavla Plašilová",
    description: "Díky za dobrý a profesionální postup. Mohu doporučit.",
    rating: 5,
    createdAt: new Date("2022-06-14")
  }
];

async function main() {
  console.log('Start seeding...');
  
  for (const review of reviews) {
    await prisma.review.create({
      data: review
    });
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 