## anon-rearby "Anonymous Nearby Chat (Because Why Not)"

Welcome to anon-nearby, the anonymous nearby chat app nobody asked for, but you’re building anyway.
It connects you with random strangers around you — because talking to people in real life is obviously too difficult.

This app uses Nuxt, Redis GEO, and a minimal green hacker vibe to make you feel cooler than you actually are.

What This App Does (Surprisingly)

Gives you a random hacker codename every time you open it, because remembering usernames is hard.

Finds nearby strangers using Redis GEO, so you can anonymously chat with someone who might literally be 20 meters away and still ignore you.

Creates a temporary chat room just for both of you.

Deletes everything when someone leaves, because we don’t do “history” here.

What This App Doesn’t Do (By Design or Laziness)

No accounts

No signup

No photos

No message history

No tracking

No fancy features
Just you, a random codename, and another confused human.

How It Works (Magic + Math)

You open the app and get a cool fake hacker name.

You allow your location because trust issues are overrated.

Redis checks if any human is near you.

If yes, you both get thrown into a chat room with zero context.

If someone leaves, the session self-destructs like it never existed.

Why This Exists

Nobody knows. Maybe boredom.
Maybe curiosity.
Maybe because every developer must eventually build a random chat app.
Whatever the reason, this one is green and anonymous.

Tech Stack (Because It Sounds Impressive)

Nuxt

Redis GEO

Node

MongoDB (optional, but who needs memory anyway)

Contributing

Feel free to fork it, break it, improve it, or make it worse.
Pull requests welcome.

License

MIT. Because writing your own license is too much effort.
