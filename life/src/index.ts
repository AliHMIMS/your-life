/**
 * Interactive form and chart events / logic.
 */
(() => {
  const yearEl = document.getElementById('year') as HTMLInputElement;
  const monthEl = document.getElementById('month') as HTMLSelectElement;
  const dayEl = document.getElementById('day') as HTMLInputElement;
  const unitboxEl = document.getElementById('unitbox') as HTMLSelectElement;
  const unitText = document.querySelector('.unitbox-label')!.textContent!.toLowerCase();
  const items = document.querySelectorAll('.chart li');
  let itemCount: number;
  const COLOR = '#e2e2e2';
  const KEY = {
    UP: 38,
    DOWN: 40
  };

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  yearEl.addEventListener('input', _handleDateChange);
  yearEl.addEventListener('keydown', _handleUpdown);
  yearEl.addEventListener('blur', _unhideValidationStyles);
  monthEl.addEventListener('change', _handleDateChange);
  monthEl.addEventListener('keydown', _handleUpdown);
  dayEl.addEventListener('input', _handleDateChange);
  dayEl.addEventListener('blur', _unhideValidationStyles);
  dayEl.addEventListener('keydown', _handleUpdown);

  // Ensure the month is unselected by default.
  monthEl.selectedIndex = -1;

  // Load default values
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement;
    window.location.href = `${target.value}.html`;
  }

  function _handleDateChange() {
    // Save date of birth in local storage
    localStorage.setItem("DOB", JSON.stringify({
      month: monthEl.value,
      year: yearEl.value,
      day: dayEl.value
    }));

    if (_dateIsValid()) {
      itemCount = calculateElapsedTime();
      _repaintItems(itemCount);
    } else {
      _repaintItems(0);
    }
  }

  function _handleUpdown(e: KeyboardEvent) {
    const target = e.target as HTMLInputElement;
    const thisKey = e.keyCode || e.which;
    
    if (target.checkValidity()) {
      if (thisKey === KEY.UP) {
        let newNum = parseInt(target.value, 10);
        target.value = (newNum += 1).toString();
        // we call the date change function manually because the input event isn't
        // triggered by arrow keys, or by manually setting the value, as we've done.
        _handleDateChange();
      } else if (thisKey === KEY.DOWN) {
        let newNum = parseInt(target.value, 10);
        target.value = (newNum -= 1).toString();
        _handleDateChange();
      }
    }
  }

  function _unhideValidationStyles(e: Event) {
    const target = e.target as HTMLElement;
    target.classList.add('touched');
  }

  function calculateElapsedTime(): number {
    const currentDate = new Date();
    const dateOfBirth = _getDateOfBirth();
    const diff = currentDate.getTime() - dateOfBirth.getTime();
    let elapsedTime = 0;

    switch (unitText) {
      case 'weeks':
        // Measuring weeks is tricky since our chart shows 52 weeks per year (for simplicity)
        // when the actual number of weeks per year is 52.143. Attempting to calculate weeks
        // with a diffing strategy will result in build-up over time. Instead, we'll add up
        // 52 per elapsed full year, and only diff the weeks on the current partial year.
        const elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        const isThisYearsBirthdayPassed = (currentDate.getTime() > new Date(currentDate.getUTCFullYear(), parseInt(monthEl.value), parseInt(dayEl.value)).getTime());
        const birthdayYearOffset = isThisYearsBirthdayPassed ? 0 : 1;
        const dateOfLastBirthday = new Date(currentDate.getUTCFullYear() - birthdayYearOffset, parseInt(monthEl.value), parseInt(dayEl.value));
        const elapsedDaysSinceLastBirthday = Math.floor((currentDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        // Months are tricky, being variable length, so I opted for the average number
        // of days in a month as a close-enough approximation (30.4375). This can make
        // the chart look off by a day when you're right on the month threshold, but
        // it's otherwise fairly accurate over long periods of time.
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        // We can represent our millisecond diff as a year and subtract 1970 to
        // end up with an accurate elapsed time. To see why, consider the following:
        //
        //   1. JavaScript's Date timestamp represents milliseconds since 1970. Thus,
        //      new Date(0).toUTCString() → 'Thu, 01 Jan 1970 00:00:00 GMT'
        //   2. Picture the diff between today and tomorrow. It's a small number. A
        //      newly created date with that number would result in January 2 1970.
        //   3. Thus, subtracting 1970 from that date gives us elapsed time. We use
        //      UTC because otherwise we'd need to offset "1970" by our timezone.
        //
        // See more details here: https://stackoverflow.com/a/24181701/1154642
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid(): boolean {
    return monthEl.checkValidity() && dayEl.checkValidity() && yearEl.checkValidity();
  }

  function _getDateOfBirth(): Date {
    return new Date(parseInt(yearEl.value), parseInt(monthEl.value), parseInt(dayEl.value));
  }

  function _repaintItems(number: number): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      if (i < number) {
        item.style.backgroundColor = COLOR;
      } else {
        item.style.backgroundColor = '';
      }
    }
  }

  function _loadStoredValueOfDOB(): void {
    const DOBString = localStorage.getItem('DOB');
    if (!DOBString) return;

    const DOB = JSON.parse(DOBString);

    if (DOB.month >= 0 && DOB.month < 12) {
      monthEl.value = DOB.month;
    }

    if (DOB.year) {
      yearEl.value = DOB.year;
    }

    if (DOB.day > 0 && DOB.day < 32) {
      dayEl.value = DOB.day;
    }
    _handleDateChange();
  }
})();
