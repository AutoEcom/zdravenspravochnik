-- Example directory data. Safe to run more than once.
-- Adds the profile columns, then upserts specialties, cities, doctors, facilities and articles.

alter table public.doctors
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;

alter table public.facilities
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;

insert into public.specialties (name, slug, description)
values
  ('Неврология', 'nevrologia', 'Главоболие, световъртеж, памет и заболявания на нервната система.'),
  ('Кардиология', 'kardiologia', 'Сърдечно-съдови прегледи, кръвно налягане и профилактика.'),
  ('Дерматология', 'dermatologia', 'Кожа, коса и нокти, включително контролни прегледи.'),
  ('Гастроентерология', 'gastroenterologia', 'Храносмилателна система, черен дроб и коремни оплаквания.'),
  ('Ендокринология', 'endokrinologia', 'Щитовидна жлеза, диабет и хормонален баланс.'),
  ('Алергология', 'alergologia', 'Алергии, астма и непоносимост към храни или лекарства.'),
  ('Педиатрия', 'pediatria', 'Проследяване и лечение на деца от раждането до юношество.'),
  ('Ортопедия и травматология', 'ortopedia', 'Болки в ставите, травми и двигателен апарат.'),
  ('УНГ', 'ung', 'Уши, нос, гърло и свързаните с тях оплаквания.'),
  ('Офталмология', 'oftalmologia', 'Зрение, очни прегледи и проследяване на хронични състояния.'),
  ('Акушерство и гинекология', 'ginekologia', 'Женско здраве, профилактика и проследяване на бременност.'),
  ('Урология', 'urologia', 'Пикочо-полова система при възрастни.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.cities (name, slug, region)
values
  ('София', 'sofia', 'София-град'),
  ('Пловдив', 'plovdiv', 'Пловдив'),
  ('Варна', 'varna', 'Варна'),
  ('Бургас', 'burgas', 'Бургас'),
  ('Стара Загора', 'stara-zagora', 'Стара Загора'),
  ('Плевен', 'pleven', 'Плевен'),
  ('Русе', 'ruse', 'Русе'),
  ('Добрич', 'dobrich', 'Добрич')
on conflict (slug) do update set
  name = excluded.name,
  region = excluded.region,
  updated_at = now();

insert into public.doctors (
  slug, full_name, title, bio, phone, email, website, address,
  specialties, cities, status, is_featured, is_premium, rating, review_count,
  short_description, accepts_nhif, accepts_children, online_consultation, working_hours
)
values
  ('nevrolog-sofia-prof-dr-milenova', 'Милена Миленова', 'Проф. д-р', 'Проф. д-р Милена Миленова преглежда възрастни с главоболие, световъртеж, изтръпване и нарушения на паметта. Приемът включва насочена анамнеза и план за изследвания, обяснен на разбираем език. Работи с направления по НЗОК и със заплащане от пациента.', '+359 2 439 1801', 'milenova@seed.zdravenspravochnik.bg', 'https://example.com/milenova', 'ул. „Раковски“ 98, София', array['nevrologia']::text[], array['sofia']::text[], 'published', true, true, 4.90, 86, 'Невролог в София за главоболие, световъртеж и нарушения на паметта.', true, false, false, '{"monday":{"closed":false,"open":"08:30","close":"16:30"},"tuesday":{"closed":false,"open":"08:30","close":"16:30"},"wednesday":{"closed":false,"open":"08:30","close":"16:30"},"thursday":{"closed":false,"open":"08:30","close":"16:30"},"friday":{"closed":false,"open":"08:30","close":"16:30"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('kardiolog-sofia-doc-dr-ivanov', 'Калин Иванов', 'Доц. д-р', 'Доц. д-р Калин Иванов приема пациенти с високо кръвно, болка в гърдите и усещане за неравномерен пулс. Първият преглед включва ЕКГ и разговор за риска от сърдечно заболяване. Предлага и кратка онлайн консултация за вече проследявани пациенти.', '+359 2 439 1802', 'ivanov@seed.zdravenspravochnik.bg', 'https://example.com/ivanov', 'бул. „Патриарх Евтимий“ 42, София', array['kardiologia']::text[], array['sofia']::text[], 'published', true, false, 4.80, 64, 'Кардиолог за кръвно налягане, ритъмни нарушения и профилактични прегледи.', true, false, true, '{"monday":{"closed":false,"open":"10:00","close":"18:00"},"tuesday":{"closed":false,"open":"10:00","close":"18:00"},"wednesday":{"closed":false,"open":"10:00","close":"18:00"},"thursday":{"closed":false,"open":"10:00","close":"18:00"},"friday":{"closed":false,"open":"10:00","close":"18:00"},"saturday":{"closed":false,"open":"10:00","close":"13:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('dermatolog-plovdiv-dr-koleva', 'Елица Колева', 'Д-р', 'Д-р Елица Колева преглежда кожа, скалп и нокти. Подходяща е за първичен преглед при обрив, акне или бенка, която се променя. Резултатът и следващата стъпка се обясняват преди края на посещението.', '+359 32 640 221', 'koleva@seed.zdravenspravochnik.bg', 'https://example.com/koleva', 'бул. „Васил Априлов“ 15А, Пловдив', array['dermatologia']::text[], array['plovdiv']::text[], 'published', true, false, 4.70, 41, 'Дерматолог в Пловдив за обриви, акне и контрол на бенки.', false, true, true, '{"monday":{"closed":false,"open":"09:00","close":"17:00"},"tuesday":{"closed":false,"open":"09:00","close":"17:00"},"wednesday":{"closed":false,"open":"09:00","close":"17:00"},"thursday":{"closed":false,"open":"09:00","close":"17:00"},"friday":{"closed":false,"open":"09:00","close":"17:00"},"saturday":{"closed":false,"open":"09:00","close":"13:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('pediatr-varna-dr-petrova', 'Ния Петрова', 'Д-р', 'Д-р Ния Петрова приема деца от първите месеци до ученическа възраст. Кабинетът е за остри оплаквания, ваксинационни въпроси и спокойно проследяване на растежа. Работи по НЗОК и отделя време за въпросите на родителите.', '+359 52 610 330', 'petrova@seed.zdravenspravochnik.bg', 'https://example.com/petrova', 'ул. „Сан Стефано“ 12, Варна', array['pediatria']::text[], array['varna']::text[], 'published', true, false, 4.90, 112, 'Педиатър във Варна за остри инфекции и редовно проследяване на деца.', true, true, false, '{"monday":{"closed":false,"open":"08:00","close":"14:00"},"tuesday":{"closed":false,"open":"08:00","close":"14:00"},"wednesday":{"closed":false,"open":"08:00","close":"14:00"},"thursday":{"closed":false,"open":"08:00","close":"14:00"},"friday":{"closed":false,"open":"08:00","close":"14:00"},"saturday":{"closed":false,"open":"09:00","close":"12:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('ortoped-burgas-dr-georgiev', 'Борис Георгиев', 'Д-р', 'Д-р Борис Георгиев преглежда болка в коляно, рамо и гръб, както и скорошни травми. След прегледа пациентът получава ясен съвет дали са нужни образно изследване, покой или рехабилитация.', '+359 56 840 114', 'georgiev@seed.zdravenspravochnik.bg', 'https://example.com/georgiev', 'ул. „Александровска“ 67, Бургас', array['ortopedia']::text[], array['burgas']::text[], 'published', false, false, 4.60, 28, 'Ортопед в Бургас за болки в ставите, гърба и спортни травми.', true, false, false, '{"monday":{"closed":false,"open":"09:00","close":"17:00"},"tuesday":{"closed":false,"open":"09:00","close":"17:00"},"wednesday":{"closed":false,"open":"09:00","close":"17:00"},"thursday":{"closed":false,"open":"09:00","close":"17:00"},"friday":{"closed":false,"open":"09:00","close":"17:00"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('oftalmolog-ruse-dr-dimitrova', 'Рая Димитрова', 'Д-р', 'Д-р Рая Димитрова прави профилактични прегледи на зрението при деца и възрастни. При замъглено виждане, сухота или главоболие след работа пред екран насочва към подходящата следваща стъпка.', '+359 82 820 455', 'dimitrova@seed.zdravenspravochnik.bg', 'https://example.com/dimitrova', 'ул. „Борисова“ 8, Русе', array['oftalmologia']::text[], array['ruse']::text[], 'published', false, false, 4.80, 53, 'Офталмолог в Русе за проверка на зрението и проследяване на очни оплаквания.', true, true, false, '{"monday":{"closed":false,"open":"08:30","close":"16:00"},"tuesday":{"closed":false,"open":"08:30","close":"16:00"},"wednesday":{"closed":false,"open":"08:30","close":"16:00"},"thursday":{"closed":false,"open":"08:30","close":"16:00"},"friday":{"closed":false,"open":"08:30","close":"16:00"},"saturday":{"closed":false,"open":"09:00","close":"12:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('endokrinolog-stara-zagora-dr-stoyanova', 'Гергана Стоянова', 'Д-р', 'Д-р Гергана Стоянова преглежда пациенти с проблеми на щитовидната жлеза, кръвната захар и теглото. Прегледът започва от наличните изследвания и завършва с конкретен план за контрол.', '+359 42 620 778', 'stoyanova@seed.zdravenspravochnik.bg', 'https://example.com/stoyanova', 'бул. „Цар Симеон Велики“ 114, Стара Загора', array['endokrinologia']::text[], array['stara-zagora']::text[], 'published', false, false, 4.50, 19, 'Ендокринолог за щитовидна жлеза, диабет и хормонални отклонения.', true, false, true, '{"monday":{"closed":false,"open":"09:00","close":"16:30"},"tuesday":{"closed":false,"open":"09:00","close":"16:30"},"wednesday":{"closed":false,"open":"09:00","close":"16:30"},"thursday":{"closed":false,"open":"09:00","close":"16:30"},"friday":{"closed":false,"open":"09:00","close":"16:30"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('alergolog-pleven-dr-hristov', 'Мартин Христов', 'Д-р', 'Д-р Мартин Христов приема деца и възрастни със сезонен ринит, кашлица и съмнение за алергия. Обяснява кои изследвания имат смисъл и кои оплаквания могат да се проследят без спешни тестове.', '+359 64 800 219', 'hristov@seed.zdravenspravochnik.bg', 'https://example.com/hristov', 'ул. „Дойран“ 21, Плевен', array['alergologia']::text[], array['pleven']::text[], 'published', false, false, 4.40, 17, 'Алерголог в Плевен за ринит, астма и хранителни реакции.', true, true, false, '{"monday":{"closed":false,"open":"08:30","close":"15:30"},"tuesday":{"closed":false,"open":"08:30","close":"15:30"},"wednesday":{"closed":false,"open":"08:30","close":"15:30"},"thursday":{"closed":false,"open":"08:30","close":"15:30"},"friday":{"closed":false,"open":"08:30","close":"15:30"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('ung-sofia-dr-angelova', 'Соня Ангелова', 'Д-р', 'Д-р Соня Ангелова преглежда болка в ухото, запушен нос, хъркане и повтарящи се гърлени инфекции. Приема и деца. След прегледа казва ясно дали е нужно лечение, наблюдение или друг специалист.', '+359 2 439 1809', 'angelova@seed.zdravenspravochnik.bg', 'https://example.com/angelova', 'ул. „Шипка“ 34, София', array['ung']::text[], array['sofia']::text[], 'published', false, false, 4.70, 36, 'УНГ специалист в София за уши, нос, гърло и детски инфекции.', true, true, false, '{"monday":{"closed":false,"open":"09:00","close":"17:30"},"tuesday":{"closed":false,"open":"09:00","close":"17:30"},"wednesday":{"closed":false,"open":"09:00","close":"17:30"},"thursday":{"closed":false,"open":"09:00","close":"17:30"},"friday":{"closed":false,"open":"09:00","close":"17:30"},"saturday":{"closed":false,"open":"09:00","close":"12:30"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('gastroenterolog-varna-prof-dr-mihov', 'Андрей Михов', 'Проф. д-р', 'Проф. д-р Андрей Михов консултира пациенти с продължителна коремна болка, парене зад гръдната кост и отклонени чернодробни показатели. Прегледът подрежда оплакванията и изследванията в разбираем план.', '+359 52 610 331', 'mihov@seed.zdravenspravochnik.bg', 'https://example.com/mihov', 'бул. „Княз Борис I“ 55, Варна', array['gastroenterologia']::text[], array['varna']::text[], 'published', false, true, 4.80, 74, 'Гастроентеролог във Варна за коремна болка, рефлукс и черен дроб.', true, false, false, '{"monday":{"closed":false,"open":"08:00","close":"15:00"},"tuesday":{"closed":false,"open":"08:00","close":"15:00"},"wednesday":{"closed":false,"open":"08:00","close":"15:00"},"thursday":{"closed":false,"open":"08:00","close":"15:00"},"friday":{"closed":false,"open":"08:00","close":"15:00"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('ginekolog-plovdiv-doc-dr-nikolova', 'Ваня Николова', 'Доц. д-р', 'Доц. д-р Ваня Николова извършва профилактични гинекологични прегледи и проследява нормална бременност. Отделя време за въпросите преди изследване и обяснява резултатите без излишен медицински език.', '+359 32 640 222', 'nikolova@seed.zdravenspravochnik.bg', 'https://example.com/nikolova', 'ул. „Македония“ 18, Пловдив', array['ginekologia']::text[], array['plovdiv']::text[], 'published', false, false, 4.60, 45, 'Акушер-гинеколог в Пловдив за профилактика и проследяване на бременност.', true, false, true, '{"monday":{"closed":false,"open":"09:00","close":"17:00"},"tuesday":{"closed":false,"open":"09:00","close":"17:00"},"wednesday":{"closed":false,"open":"09:00","close":"17:00"},"thursday":{"closed":false,"open":"09:00","close":"17:00"},"friday":{"closed":false,"open":"09:00","close":"17:00"},"saturday":{"closed":false,"open":"09:00","close":"13:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('urolog-dobrich-dr-yanev', 'Петър Янев', 'Д-р', 'Д-р Петър Янев приема възрастни с болка, често уриниране или нужда от профилактичен урологичен преглед. Посещението започва с разговор и преглед, а изследванията се назначават само когато променят решението.', '+359 58 600 142', 'yanev@seed.zdravenspravochnik.bg', 'https://example.com/yanev', 'ул. „Независимост“ 5, Добрич', array['urologia']::text[], array['dobrich']::text[], 'published', false, false, 4.20, 12, 'Уролог в Добрич за профилактични прегледи и оплаквания на пикочните пътища.', true, false, false, '{"monday":{"closed":false,"open":"08:30","close":"16:00"},"tuesday":{"closed":false,"open":"08:30","close":"16:00"},"wednesday":{"closed":false,"open":"08:30","close":"16:00"},"thursday":{"closed":false,"open":"08:30","close":"16:00"},"friday":{"closed":false,"open":"08:30","close":"16:00"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb)
on conflict (slug) do update set
  full_name = excluded.full_name,
  title = excluded.title,
  bio = excluded.bio,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  address = excluded.address,
  specialties = excluded.specialties,
  cities = excluded.cities,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_premium = excluded.is_premium,
  rating = excluded.rating,
  review_count = excluded.review_count,
  short_description = excluded.short_description,
  accepts_nhif = excluded.accepts_nhif,
  accepts_children = excluded.accepts_children,
  online_consultation = excluded.online_consultation,
  working_hours = excluded.working_hours,
  updated_at = now();

insert into public.facilities (
  slug, name, facility_type, description, phone, email, website, address,
  specialties, cities, status, is_featured, is_premium, rating, review_count,
  short_description, accepts_nhif, accepts_children, online_consultation, working_hours
)
values
  ('dkc-sofia-centar', 'ДКЦ „София Център“', 'clinic', 'ДКЦ „София Център“ събира специалисти за първични и контролни прегледи в центъра на София. Пациентите могат да дойдат с направление по НЗОК или на свободен прием. Регистратурата потвърждава часа и нужните документи преди посещението.', '+359 2 439 1900', 'dkc@seed.zdravenspravochnik.bg', 'https://example.com/dkc-sofia-centar', 'ул. „Граф Игнатиев“ 4, София', array['nevrologia', 'kardiologia', 'ung']::text[], array['sofia']::text[], 'published', true, true, 4.60, 96, 'Диагностично-консултативен център с кабинети по неврология, кардиология и УНГ.', true, true, false, '{"monday":{"closed":false,"open":"07:30","close":"19:00"},"tuesday":{"closed":false,"open":"07:30","close":"19:00"},"wednesday":{"closed":false,"open":"07:30","close":"19:00"},"thursday":{"closed":false,"open":"07:30","close":"19:00"},"friday":{"closed":false,"open":"07:30","close":"19:00"},"saturday":{"closed":false,"open":"08:00","close":"14:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('mc-plovdiv-vita', 'МЦ „Вита“', 'clinic', 'МЦ „Вита“ е градски медицински център за планови прегледи и профилактика. Кабинетите работят с предварителен час. Резултатите се обясняват на място, а при нужда пациентът се насочва към болнична помощ.', '+359 32 640 300', 'vita@seed.zdravenspravochnik.bg', 'https://example.com/mc-plovdiv-vita', 'ул. „Княз Александър I“ 26, Пловдив', array['dermatologia', 'endokrinologia', 'ginekologia']::text[], array['plovdiv']::text[], 'published', true, false, 4.70, 58, 'Медицински център в Пловдив с дерматология, ендокринология и гинекология.', true, true, true, '{"monday":{"closed":false,"open":"08:00","close":"19:00"},"tuesday":{"closed":false,"open":"08:00","close":"19:00"},"wednesday":{"closed":false,"open":"08:00","close":"19:00"},"thursday":{"closed":false,"open":"08:00","close":"19:00"},"friday":{"closed":false,"open":"08:00","close":"19:00"},"saturday":{"closed":false,"open":"09:00","close":"14:00"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('bolnica-varna-chernomorska', 'МБАЛ „Черноморска“', 'hospital', 'МБАЛ „Черноморска“ приема пациенти за консулт и болнично лечение по няколко специалности. Спешните състояния се приемат денонощно, а плановите прегледи минават през регистратура с предварителен час.', '+359 52 610 400', 'bolnica@seed.zdravenspravochnik.bg', 'https://example.com/bolnica-varna', 'бул. „Христо Ботев“ 20, Варна', array['pediatria', 'kardiologia', 'gastroenterologia']::text[], array['varna']::text[], 'published', false, false, 4.50, 140, 'Многопрофилна болница във Варна с педиатрия, кардиология и гастроентерология.', true, true, false, '{"monday":{"closed":false,"open":"00:00","close":"23:59"},"tuesday":{"closed":false,"open":"00:00","close":"23:59"},"wednesday":{"closed":false,"open":"00:00","close":"23:59"},"thursday":{"closed":false,"open":"00:00","close":"23:59"},"friday":{"closed":false,"open":"00:00","close":"23:59"},"saturday":{"closed":false,"open":"00:00","close":"23:59"},"sunday":{"closed":false,"open":"00:00","close":"23:59"}}'::jsonb),
  ('laboratoriya-burgas-medilab', 'Лаборатория „МедиЛаб“', 'laboratory', 'Лаборатория „МедиЛаб“ взема кръв сутрин и връща резултатите в същия или следващия ден. Подходяща е преди преглед при ендокринолог, кардиолог или личен лекар. Не се изисква предварителен час за стандартни изследвания.', '+359 56 840 200', 'medilab@seed.zdravenspravochnik.bg', 'https://example.com/medilab', 'ул. „Булаир“ 11, Бургас', array['endokrinologia', 'kardiologia']::text[], array['burgas']::text[], 'published', false, false, 4.40, 33, 'Лаборатория в Бургас за кръвни, хормонални и профилактични изследвания.', true, true, false, '{"monday":{"closed":false,"open":"07:00","close":"17:00"},"tuesday":{"closed":false,"open":"07:00","close":"17:00"},"wednesday":{"closed":false,"open":"07:00","close":"17:00"},"thursday":{"closed":false,"open":"07:00","close":"17:00"},"friday":{"closed":false,"open":"07:00","close":"17:00"},"saturday":{"closed":false,"open":"07:30","close":"12:30"},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb),
  ('mc-ruse-zdrave', 'МЦ „Здраве“', 'clinic', 'МЦ „Здраве“ предлага планови прегледи в спокойна градска среда. Часовете се записват по телефона, а регистратурата напомня какво да носите за първото посещение.', '+359 82 820 500', 'zdrave@seed.zdravenspravochnik.bg', 'https://example.com/mc-ruse-zdrave', 'ул. „Александровска“ 3, Русе', array['oftalmologia', 'alergologia']::text[], array['ruse']::text[], 'published', false, false, 4.60, 22, 'Медицински център в Русе с очни и алергологични кабинети.', true, true, false, '{"monday":{"closed":false,"open":"08:30","close":"17:30"},"tuesday":{"closed":false,"open":"08:30","close":"17:30"},"wednesday":{"closed":false,"open":"08:30","close":"17:30"},"thursday":{"closed":false,"open":"08:30","close":"17:30"},"friday":{"closed":false,"open":"08:30","close":"17:30"},"saturday":{"closed":true,"open":null,"close":null},"sunday":{"closed":true,"open":null,"close":null}}'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  facility_type = excluded.facility_type,
  description = excluded.description,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  address = excluded.address,
  specialties = excluded.specialties,
  cities = excluded.cities,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_premium = excluded.is_premium,
  rating = excluded.rating,
  review_count = excluded.review_count,
  short_description = excluded.short_description,
  accepts_nhif = excluded.accepts_nhif,
  accepts_children = excluded.accepts_children,
  online_consultation = excluded.online_consultation,
  working_hours = excluded.working_hours,
  updated_at = now();

insert into public.articles (slug, title, excerpt, content, status, published_at)
values
  ('statia-kogato-pri-kardiolog', 'Кога да запишете час при кардиолог', 'Кои оплаквания заслужават преглед и какво е полезно да подготвите преди него.', 'Болка в гърдите, задух при обичайно усилие и рязко повишено кръвно налягане са причина да потърсите кардиолог, без да чакате следващия профилактичен преглед.

За първото посещение носете предишни ЕКГ, списък с лекарствата и бележка кога започва оплакването. Това спестява повторени изследвания.

Ако болката е силна, придружена със задух или прилошаване, обадете се на спешна помощ вместо да търсите планов час.', 'published', '2026-10-12T08:00:00.000Z'::timestamptz),
  ('statia-izbor-na-pediatr', 'Как да изберете педиатър за детето', 'Няколко практични въпроса за локация, прием на остри състояния и начина на обяснение.', 'Добрият педиатър е този, до когото стигате навреме и който обяснява спокойно какво се случва. Близостта до дома и ясният телефон за остри оплаквания често тежат повече от дългия списък със сертификати.

Попитайте дали кабинетът приема деца по НЗОК, как се записва спешен час и кой поема пациентите при отпуск.

На първия преглед наблюдавайте дали лекарят говори и с детето, и с вас. Това обикновено показва как ще изглеждат и следващите посещения.', 'published', '2026-10-03T08:00:00.000Z'::timestamptz),
  ('statia-dermatologichen-pregled', 'Какво да очаквате на дерматологичен преглед', 'Кратък ориентир преди посещение за обрив, акне или контрол на бенка.', 'Дерматологичният преглед обикновено започва с въпрос кога е започнало оплакването и дали нещо го променя. Не е нужно да спирате грижата за кожата в деня преди часа, освен ако лекарят не е посочил друго.

За бенка, която расте, кърви или сменя цвета си, запишете час по-скоро и не разчитайте само на снимка.

След прегледа поискайте ясната следваща стъпка: лечение, наблюдение или допълнително изследване.', 'published', '2026-09-21T08:00:00.000Z'::timestamptz),
  ('statia-nevrologichen-pregled', 'Какво показва първият неврологичен преглед', 'Защо анамнезата е по-важна от дългия списък със снимки и как да опишете оплакването.', 'Първият неврологичен преглед най-често търси модела на оплакването: кога започва, колко трае и какво го усилва. Добре описано главоболие или световъртеж често насочва по-точно от поредната снимка.

Запишете честотата на епизодите и лекарствата, които вече сте пробвали. Ако има придружител, който е виждал пристъпа, полезно е да дойде с вас.

Лекарят ще каже дали са нужни допълнителни изследвания, или проследяването може да започне с промяна в дневния режим.', 'published', '2026-09-08T08:00:00.000Z'::timestamptz)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

insert into public.facility_doctors (facility_id, doctor_id, position, is_primary)
values
  (
    (select id from public.facilities where slug = 'dkc-sofia-centar'),
    (select id from public.doctors where slug = 'nevrolog-sofia-prof-dr-milenova'),
    'Невролог',
    true
  ),
  (
    (select id from public.facilities where slug = 'dkc-sofia-centar'),
    (select id from public.doctors where slug = 'kardiolog-sofia-doc-dr-ivanov'),
    'Кардиолог',
    false
  ),
  (
    (select id from public.facilities where slug = 'dkc-sofia-centar'),
    (select id from public.doctors where slug = 'ung-sofia-dr-angelova'),
    'УНГ',
    false
  ),
  (
    (select id from public.facilities where slug = 'mc-plovdiv-vita'),
    (select id from public.doctors where slug = 'dermatolog-plovdiv-dr-koleva'),
    'Дерматолог',
    true
  ),
  (
    (select id from public.facilities where slug = 'mc-plovdiv-vita'),
    (select id from public.doctors where slug = 'ginekolog-plovdiv-doc-dr-nikolova'),
    'Акушер-гинеколог',
    false
  ),
  (
    (select id from public.facilities where slug = 'bolnica-varna-chernomorska'),
    (select id from public.doctors where slug = 'pediatr-varna-dr-petrova'),
    'Педиатър',
    true
  ),
  (
    (select id from public.facilities where slug = 'bolnica-varna-chernomorska'),
    (select id from public.doctors where slug = 'gastroenterolog-varna-prof-dr-mihov'),
    'Гастроентеролог',
    false
  )
on conflict (facility_id, doctor_id) do update set
  position = excluded.position,
  is_primary = excluded.is_primary,
  updated_at = now();
