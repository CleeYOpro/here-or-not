declare module '@fullcalendar/core' {
  const FullCalendar: {
    Calendar: new (el: HTMLElement, options: object) => { render: () => void };
  };
  export default FullCalendar;
}
