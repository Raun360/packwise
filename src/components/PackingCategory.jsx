import { ChevronDown } from 'lucide-react';
import PackingItem from './PackingItem.jsx';

export default function PackingCategory({ category, open, onToggleOpen, onToggleItem, targetId }) {
  const packed = category.items.filter((i) => i.packed).length;
  const total = category.items.length;
  const allDone = total > 0 && packed === total;
  const bodyId = `cat-${category.id}`;

  return (
    <section className={`card category${open ? ' open' : ''}`} aria-labelledby={`${bodyId}-h`}>
      <button
        type="button"
        className="category-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggleOpen}
      >
        <div className="category-title">
          <h2 id={`${bodyId}-h`}>
            {category.label}
            <span className={`category-count tnum${allDone ? ' all-done' : ''}`}>
              {allDone ? 'Done' : `${packed}/${total}`}
            </span>
          </h2>
          <p>{category.blurb}</p>
        </div>
        <span className="category-chevron" aria-hidden="true"><ChevronDown /></span>
      </button>

      {open && (
        <ul className="category-items" id={bodyId}>
          {category.items.map((item) => (
            <PackingItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              isTarget={targetId === item.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
