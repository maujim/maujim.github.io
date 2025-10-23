// worked through example of what the script does
/* The animation loop lasts 60s */
/* i want each dot to animate over 5s, which is ~8.333% */
/* i want a max of 1.6 brightness, in increments of 0.15 */
/* 1->1.6->1 in 0.15 increments is 8 steps */
/* 5s / 8 = 0.625s */
/* (0.625 / 60 ) * 100 = 1.041% */

// all durations are in seconds
const loop_duration = 60;
const dot_animation_duration = 2.2;

const base_brightness = 1;
const max_brightness = 1.6;
const increment = 0.15;

const total_steps = (max_brightness - base_brightness) / increment;
const step_duration = dot_animation_duration / (total_steps * 2);
const percent_increment = (step_duration / loop_duration) * 100;

const explanation = `/* scales from ${base_brightness} -> ${max_brightness} -> ${base_brightness} across ${dot_animation_duration} seconds*/`;

const keyframes = [];

keyframes.push({ percent: 0, brightness: base_brightness });

// Ramp up
for (let i = 1; i <= total_steps; i++) {
  const brightness = +(base_brightness + increment * i).toFixed(2);
  const percent = +(i * percent_increment).toFixed(2);
  keyframes.push({ percent, brightness });
}

// Ramp down
for (let i = total_steps - 1; i >= 0; i--) {
  const brightness = +(base_brightness + increment * i).toFixed(2);
  const percent = +((total_steps * 2 - i) * percent_increment).toFixed(2);
  keyframes.push({ percent, brightness });
}

keyframes.push({ percent: 100, brightness: base_brightness });

// Output
console.log(explanation);
console.log("@keyframes shimmer {");
keyframes.forEach(({ percent, brightness }) => {
  console.log(`${percent}% { filter: brightness(${brightness}); }`);
});
console.log("}");
