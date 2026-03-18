// Listen for when the widget is added or needs an update
self.onwidgetinstall = (event) => {
  event.waitUntil(updateWidget(event.widget));
};

async function updateWidget(widget) {
  // 1. Fetch the data (e.g., from your Firebase or a static list)
  const vocabData = {
    word: "Magister",
    definition: "A master, teacher, or person of authority."
  };

  // 2. Get the template we created in Step 1
  const template = await (await fetch('/widgets/hub.json')).json();

  // 3. Push the data to the widget
  await self.widgets.updateByTag('magister-hub-widget', {
    template: JSON.stringify(template),
    data: JSON.stringify(vocabData)
  });
}
