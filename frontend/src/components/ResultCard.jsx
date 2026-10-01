import { formatHours, formatItemType, formatPrice } from '../utils/format.js';
import { matchesTerm } from '../utils/validate.js';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 7.5L8 2.5l6 5M3.5 6.5V13h9V6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ResultCard({ item, searchQuery, isLowest }) {
  const { pricing, logistics } = item;
  const isPackage = item.item_type === 'package';
  const hasFee = logistics.home_collection && logistics.home_collection_fee > 0;
  const freeCollection = logistics.home_collection && !hasFee;

  return (
    <article className={`card${isLowest ? ' card-lowest' : ''}`} aria-label={`${item.item_name} from ${item.provider_name}`}>
      <div className="card-main">
        <div className="card-top">
          <h3 className="provider">{item.provider_name}</h3>
          <span className={`pill ${isPackage ? 'pill-package' : 'pill-test'}`}>{formatItemType(item.item_type)}</span>
          {item.nabl_accredited && (
            <span className="pill pill-nabl">
              <CheckIcon /> NABL Certified
            </span>
          )}
        </div>

        <p className="item-name">{item.item_name}</p>

        {isPackage && item.included_tests.length > 0 && (
          <div className="included">
            <p className="included-title">Included Tests</p>
            <ul className="chips">
              {item.included_tests.map((test) => (
                <li key={test} className={`chip${matchesTerm(test, searchQuery) ? ' chip-match' : ''}`}>
                  {test}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="logistics">
          <li>
            <HomeIcon />
            {logistics.home_collection ? 'Home collection available' : 'Lab visit only'}
          </li>
          <li>
            <ClockIcon />
            Report in {formatHours(logistics.report_tat_hours)}
          </li>
        </ul>
      </div>

      <aside className="price-panel" aria-label="Price breakdown">
        {isLowest && <p className="lowest-flag">Lowest price</p>}
        <p className="mrp">
          MRP <s>{formatPrice(pricing.mrp)}</s>
        </p>

        <p className="breakdown">
          {hasFee ? (
            <>
              {formatPrice(pricing.offer_price)} <span aria-hidden="true">+</span>{' '}
              {formatPrice(logistics.home_collection_fee)} home collection
            </>
          ) : (
            <>{formatPrice(pricing.offer_price)} offer price</>
          )}
        </p>
        {freeCollection && <p className="free-collection">Home Collection · FREE</p>}

        <div className="final">
          <span className="final-label">Final Price</span>
          <span className="final-amount">{formatPrice(item.total_final_price)}</span>
        </div>
      </aside>
    </article>
  );
}
