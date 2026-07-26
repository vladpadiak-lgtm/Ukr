import type { WantedMeta, WantedRecord } from "@/lib/wanted";
import {
  formatDate,
  getCategory,
  getInitials,
} from "@/lib/wanted";

type ProfileProps = {
  meta: WantedMeta;
  record: WantedRecord | null;
};

export function PersonProfile({ record, meta }: ProfileProps) {
  if (!record) {
    return (
      <main className="profile-shell">
        <a className="back-link" href="/">
          ← Повернутися до каталогу
        </a>
        <div className="profile-missing">
          <span>404</span>
          <h1>Запис не знайдено</h1>
          <p>
            Його немає у перевіреній вибірці за 2022—{meta.endDate.slice(0, 4)} роки
            або він був знятий з офіційного розшуку.
          </p>
        </div>
      </main>
    );
  }

  const category = getCategory(meta, record.c);
  const sourceDate = meta.sourceUpdatedAt?.slice(0, 10) || meta.endDate;

  return (
    <main className="profile-page">
      <header className="site-header profile-header">
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

      <div className="profile-shell">
        <a className="back-link" href="/">
          ← Повернутися до каталогу
        </a>

        <section className="profile-hero">
          <div className={`profile-portrait portrait-${record.c}`}>
            <span className="portrait-grid" aria-hidden="true" />
            <span className="profile-initials">{getInitials(record.n)}</span>
            <span className="portrait-label">Фото не відтворено</span>
          </div>
          <div className="profile-title">
            <div className="profile-status-row">
              <span className={`category-tag tag-${record.c}`}>
                {category?.label || "Офіційний розшук"}
              </span>
              <span>ID {record.id}</span>
            </div>
            <h1>{record.n}</h1>
            {record.e ? <p className="transliteration">{record.e}</p> : null}
            <p className="profile-lead">
              Запис оприлюднений у державному наборі даних як активна картка
              розшуку. Наведені нижче формулювання не є вироком суду.
            </p>
          </div>
        </section>

        <div className="profile-layout">
          <div className="profile-main">
            <section className="detail-section">
              <div className="detail-index">01</div>
              <div>
                <span className="section-kicker">Підстава розшуку</span>
                <h2>Що вказано в офіційній картці</h2>
                <dl className="detail-list">
                  <div>
                    <dt>Категорія</dt>
                    <dd>{category?.label || "Не вказано"}</dd>
                  </div>
                  <div>
                    <dt>Статті</dt>
                    <dd className="article-value">{record.a || "Не вказано"}</dd>
                  </div>
                  <div>
                    <dt>Запобіжний захід / статус</dt>
                    <dd>{record.r || "Не вказано"}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-index">02</div>
              <div>
                <span className="section-kicker">Хронологія</span>
                <h2>Дати у записі</h2>
                <dl className="detail-list two-column">
                  <div>
                    <dt>Дата народження</dt>
                    <dd>{formatDate(record.b)}</dd>
                  </div>
                  <div>
                    <dt>Дата розшуку / зникнення</dt>
                    <dd>{formatDate(record.d)}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-index">03</div>
              <div>
                <span className="section-kicker">Географія</span>
                <h2>Місце, зазначене у картці</h2>
                <p className="location-value">{record.p || "Не вказано"}</p>
                <div className="caution-box">
                  Це не поточне й не «ймовірне» місцезнаходження. Офіційний
                  набір не містить підтверджених даних про те, де особа
                  перебуває зараз.
                </div>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-index">04</div>
              <div>
                <span className="section-kicker">Орган розшуку</span>
                <h2>Відповідальний підрозділ</h2>
                <p className="authority-value">{record.o || "Не вказано"}</p>
              </div>
            </section>
          </div>

          <aside className="profile-aside">
            <div className="aside-card">
              <span>Статус запису</span>
              <strong>
                <i className="status-dot" aria-hidden="true" />
                Опубліковано у відкритих даних
              </strong>
              <small>Перевірено {formatDate(sourceDate)}</small>
            </div>
            <div className="aside-card aside-note">
              <span>Презумпція невинуватості</span>
              <p>
                Особа вважається невинуватою, доки її вину не доведено у
                встановленому законом порядку обвинувальним вироком суду.
              </p>
            </div>
            <div className="aside-card aside-note">
              <span>Про фото</span>
              <p>
                Офіційні фотоматеріали публікуються окремими масивами. Цей
                полегшений каталог не відтворює їх без додаткової перевірки
                відповідності конкретному запису.
              </p>
            </div>
          </aside>
        </div>
      </div>

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
