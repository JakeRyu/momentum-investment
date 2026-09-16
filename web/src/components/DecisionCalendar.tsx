/**
 * Lesson 4's month, as a calendar.
 *
 * Drawn first as a timeline, which failed: a line with a mark at each
 * end says "nothing happens in between" with empty space, and empty
 * space reads as a gap in the drawing rather than a gap in the work. A
 * calendar spends the same thirty days as a grid, so the quiet part is
 * countable instead of blank.
 *
 * Two things the prose has to spell out come free from the form. The
 * close the signal is computed at lands on the last *business* day
 * rather than the 31st, and the day you act is the first business day
 * after it — both legible at a glance because the weekend columns are
 * greyed.
 *
 * The month is illustrative, not the current one: it carries no month
 * name and is not derived from today's date. A real calendar would make
 * this a thing to keep correct, and would say something new every
 * month, which is the opposite of the lesson's point.
 */

const DAYS_IN_MONTH = 31
/** Tail of the previous month, so the 1st lands on a Tuesday. */
const LEAD = [29, 30]
/** Head of the next month, to show the following decision already set. */
const TRAIL = [1, 2]

/** Mid-month days where something happened and nothing was done. */
const NOISE = [8, 17]

type Cell = {
  day: number
  outside: boolean
  weekend: boolean
  mark?: 'close' | 'act' | 'next'
  noise?: boolean
}

function buildMonth(): Cell[] {
  const cells: Cell[] = [
    // The previous month's last business day is the close the rule reads.
    ...LEAD.map((day, i) => ({
      day,
      outside: true,
      weekend: false,
      mark: i === LEAD.length - 1 ? ('close' as const) : undefined,
    })),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
      day: i + 1,
      outside: false,
      weekend: false,
      // The 1st is the first business day; the 31st is the next close.
      mark:
        i === 0
          ? ('act' as const)
          : i === DAYS_IN_MONTH - 1
            ? ('close' as const)
            : undefined,
      noise: NOISE.includes(i + 1),
    })),
    ...TRAIL.map((day, i) => ({
      day,
      outside: true,
      weekend: false,
      mark: i === 0 ? ('next' as const) : undefined,
    })),
  ]

  // Column 0 is Sunday and column 6 Saturday, so the weekend falls out of
  // the position rather than being listed per day.
  return cells.map((cell, i) => ({
    ...cell,
    weekend: i % 7 === 0 || i % 7 === 6,
  }))
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function DecisionCalendar() {
  const cells = buildMonth()
  const asking = cells.filter((c) => c.mark === 'act').length

  return (
    <figure className="calendar">
      <figcaption className="calendar__caption">
        A month on the rule&rsquo;s clock
      </figcaption>

      <div className="calendar__layout">
        <div className="calendar__grid" aria-hidden="true">
          {DOW.map((d, i) => (
            <span key={i} className="calendar__dow">
              {d}
            </span>
          ))}
          {cells.map((cell, i) => (
            <span
              key={i}
              className={[
                'calendar__day',
                cell.outside && 'calendar__day--outside',
                cell.weekend && 'calendar__day--weekend',
                cell.mark && `calendar__day--${cell.mark}`,
                cell.noise && 'calendar__day--noise',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {cell.day}
            </span>
          ))}
        </div>

        <div className="calendar__key">
          <Key mark="close" title="Month-end close">
            The rule is computed on this price. It is the last business day,
            not the 31st.
          </Key>
          <Key mark="act" title="You act">
            First business day. Compare, then trade the difference — often
            nothing at all.
          </Key>
          <Key mark="noise" title="A headline · a Tuesday">
            News broke, a market moved. The allocation does not change.
          </Key>
          <Key mark="next" title="Next decision">
            Already on its way, whatever happens in between.
          </Key>

          <p className="calendar__tally">
            <span className="calendar__tally-figure">
              {asking} <em>of</em> {DAYS_IN_MONTH}
            </span>
            <span className="calendar__tally-label">
              days that ask anything of you
            </span>
          </p>
        </div>
      </div>
    </figure>
  )
}

function Key({
  mark,
  title,
  children,
}: {
  mark: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="calendar__k">
      <p className="calendar__k-head">
        <i className={`calendar__swatch calendar__swatch--${mark}`} />
        {title}
      </p>
      <p className="calendar__k-body">{children}</p>
    </div>
  )
}
