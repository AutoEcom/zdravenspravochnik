-- Descriptions with links to specialty listings.
-- Apply in the Supabase SQL editor after 008_view_counts.sql.

update public.article_categories
set description = 'Чести оплаквания и кога обикновено се търси помощ. При главоболие и световъртеж често се насочват към [невролог](/category/specialisti/nevrologia); при кожни промени — към [дерматолог](/category/specialisti/dermatologia); при гръдна болка или високо налягане — към [кардиолог](/category/specialisti/kardiologia).'
where slug = 'simptomi-i-sastoyaniya';

update public.article_categories
set description = 'Какво означават често назначавани изследвания. Резултатите се тълкуват с лекуващия лекар — [ендокринолог](/category/specialisti/endokrinologia), [гастроентеролог](/category/specialisti/gastroenterologia) или друг [специалист](/specialisti) според случая.'
where slug = 'izsledvaniya-i-podgotovka';

update public.article_categories
set description = 'Теми около здравето на децата. Първа линия е [педиатър](/category/specialisti/pediatria); при нужда се включват и други детски направления от справочника.'
where slug = 'detsko-zdrave';

update public.article_categories
set description = 'Профилактика, цикъл, бременност и свързани теми. Най-често се работи с [акушер-гинеколог](/category/specialisti/ginekologia); при хормонални въпроси — и с [ендокринолог](/category/specialisti/endokrinologia).'
where slug = 'jensko-zdrave';

update public.article_categories
set description = 'Кога е разумно да се потърси подкрепа. В справочника можете да намерите [психиатър](/category/specialisti/psihiatria) и свързани профили.'
where slug = 'psihichno-zdrave';

update public.article_categories
set description = 'Практически бележки около посещението при специалист. Изберете направление от [каталога](/specialisti) и уточнете детайлите директно с кабинета.'
where slug = 'saveti-predi-pregled';

update public.article_categories
set description = 'Храна и навици в контекста на здравето. При метаболитни и хормонални въпроси често се търси [ендокринолог](/category/specialisti/endokrinologia).'
where slug = 'hranene-i-metabolizam';
