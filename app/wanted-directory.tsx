"use client";

import { useEffect, useMemo, useState } from "react";
import type { WantedMeta, WantedRecord } from "@/lib/wanted";
import {
  formatDate,
  formatNumber,
  getCategory,
  getInitials,
  normalizeSearch,
} from "@/lib/wanted";

const recordsCache = new Map<string, WantedRecord[]>();
const PAGE_SIZE = 24;

type DirectoryProps = {
  meta: WantedMeta;
  initialRecords: WantedRecord[];
};

async function loadYear(year: string) {
  const cached = recordsCache.get(year);
  if (cached) return cached;

  const response = await fetch(`/data/${year}.json`);
  if (!response.ok) throw new Error(`Не вдалося завантажити дані за ${year} рік.`);
  const records = (await response.json()) as WantedRecord[];
  recordsCache.set(year, records);
  return records;
}

export function WantedDirectory({ meta, initialRecords }: DirectoryProps) {
  const years = Object.keys(meta.years).sort((a, b) => b.localeCompare(a));
  const defaultYear = years[0];
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<WantedRecord[]>(initialRecords);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    setVisibleCount(PAGE_SIZE);

    if (selectedYear === defaultYear) {
      setRecords(initialRecords);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    const request =
      selectedYear === "all"
        ? Promise.all(
            years.map((year) =>
              year === defaultYear ? Promise.resolve(initialRecords) : loadYear(year),
            ),
          ).then((groups) => groups.flat())
        : loadYear(selectedYear);

    request
      .then((nextRecords) => {
        if (!active) return;
        setRecords(nextRecords);
      })
      .catch((reason: Error) => {
        if (!active) return;
        setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [defaultYear, initialRecords, selectedYear, years.join(",")]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return records.filter((record) => {
      if (selectedCategory !== "all" && record.c !== selectedCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      return normalizeSearch(`${record.n} ${record.e} ${record.a} ${record.p}`).includes(
        normalizedQuery,
      );
    });
  }, [query, records, selectedCategory]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const sourceDate = meta.sourceUpdatedAt?.slice(0, 10) || meta.endDate;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Реєстр розшуку — головна">
          <span className="brand-mark" aria-hidden="true">
            Р
          </span>
          <span>
            <strong>Реєстр розшуку</strong>
            <small>Незалежний каталог відкритих даних</small>
          </span>
        </a>
        <div className="header-status">
          <span className="status-dot" aria-hidden="true" />
          Дані перевірено {formatDate(sourceDate)}
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span>Україна</span>
            <span>2022—{meta.endDate.slice(0, 4)}</span>
          </div>
          <h1>
            Офіційний розшук.
            <br />
            <em>Без домислів.</em>
          </h1>
          <p>
            Відкритий каталог осіб, оголошених у розшук українськими
            правоохоронними органами з 1 січня 2022 року. Статус, статті,
            дата та орган розшуку — рівно так, як їх оприлюднено у державному
            наборі даних.
          </p>
          <a className="hero-cta" href="#catalog">
            Переглянути {formatNumber(meta.total)} записів
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="hero-metrics" aria-label="Статистика каталогу">
          <div className="metric metric-primary">
            <span>Записів</span>
            <strong>{formatNumber(meta.total)}</strong>
            <small>актуальних на дату оновлення</small>
          </div>
          <div className="metric">
            <span>Період</span>
            <strong>{Object.keys(meta.years).length}</strong>
            <small>календарних років</small>
          </div>
          <div className="metric">
            <span>Джерело</span>
            <strong>НПУ</strong>
            <small>державний портал data.gov.ua</small>
          </div>
        </div>
      </section>

      <section className="directory" id="catalog">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Каталог</span>
            <h2>Знайти офіційний запис</h2>
          </div>
          <p>
            Пошук працює за ПІБ, транслітерацією, статтею та місцем, указаним
            у картці.
          </p>
        </div>

        <div className="search-panel">
          <label className="search-field">
            <span>Пошук</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Прізвище, стаття або місце…"
              autoComplete="off"
            />
            <kbd>⌘ K</kbd>
          </label>

          <label className="select-field">
            <span>Рік оголошення</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year} · {formatNumber(meta.years[year])}
                </option>
              ))}
              <option value="all">Усі роки · {formatNumber(meta.total)}</option>
            </select>
          </label>

          <label className="select-field">
            <span>Категорія</span>
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <option value="all">Усі категорії</option>
              {meta.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="results-bar" aria-live="polite">
          <span>
            {loading
              ? "Завантаження офіційних записів…"
              : `Знайдено ${formatNumber(filteredRecords.length)}`}
          </span>
          <span className="results-note">Оновлення: {formatDate(sourceDate)}</span>
        </div>

        {error ? (
          <div className="empty-state">
            <strong>Дані тимчасово недоступні</strong>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="cards-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div className="person-card card-skeleton" key={index} />
            ))}
          </div>
        ) : visibleRecords.length ? (
          <>
            <div className="cards-grid">
              {visibleRecords.map((record) => {
                const category = getCategory(meta, record.c);
                return (
                  <a
                    className="person-card"
                    href={`/person/${record.id}`}
                    key={record.id}
                  >
                    <div className={`portrait portrait-${record.c}`}>
                      <span className="portrait-grid" aria-hidden="true" />
                      <span className="portrait-initials">
                        {getInitials(record.n)}
                      </span>
                      <span className="portrait-label">Фото не відтворено</span>
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className={`category-tag tag-${record.c}`}>
                          {category?.label || "Офіційний розшук"}
                        </span>
                        <span>{formatDate(record.d)}</span>
                      </div>
                      <h3>{record.n}</h3>
                      <dl>
                        <div>
                          <dt>Дата народження</dt>
                          <dd>{formatDate(record.b)}</dd>
                        </div>
                        <div>
                          <dt>Стаття</dt>
                          <dd>{record.a || "Не вказано"}</dd>
                        </div>
                        <div>
                          <dt>Місце у картці</dt>
                          <dd>{record.p || "Не вказано"}</dd>
                        </div>
                      </dl>
                      <span className="card-link">
                        Відкрити картку <span aria-hidden="true">↗</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {visibleCount < filteredRecords.length ? (
              <button
                className="load-more"
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Показати ще {Math.min(PAGE_SIZE, filteredRecords.length - visibleCount)}
                <span aria-hidden="true">↓</span>
              </button>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <strong>Збігів не знайдено</strong>
            <p>Спробуйте інший рік, категорію або коротший пошуковий запит.</p>
          </div>
        )}
      </section>

      <section className="truth-strip">
        <span className="truth-index">01</span>
        <p>
          <strong>Що цей каталог не стверджує.</strong> Державний набір не
          підтверджує громадянство, факт виїзду за кордон, поточне
          місцезнаходження або винуватість особи. Поле «місце» — це остання
          географічна прив’язка, зазначена у картці розшуку.
        </p>
      </section>

      <section className="methodology">
        <div>
          <span className="section-kicker">Методологія</span>
          <h2>Лише те, що можна перевірити</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Єдине джерело</strong>
              <p>Використано офіційний набір Національної поліції України.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Чіткий період</strong>
              <p>У каталозі записи з 01.01.2022 до {formatDate(meta.endDate)}.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Без припущень</strong>
              <p>Жодних прогнозів про місце перебування чи оцінок винуватості.</p>
            </div>
          </li>
        </ol>
      </section>

      <footer className="site-footer">
        <div>
          <strong>Реєстр розшуку</strong>
          <span>Громадський інтерфейс до відкритих даних</span>
        </div>
        <p>
          Джерело: {meta.sourceName}. Ліцензія: {meta.license}. Цей сайт не є
          офіційним сайтом органу державної влади.
        </p>
      </footer>
    </main>
  );
}
