import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, tick, advanceDialogue} from '../src/domain/game.js';
import {stories} from '../src/application/i18n.js';

test('player inputs complete both bosses, all echoes, upgrades, and the human ending', (t) => {
  const game = createGame();
  game.started = true;
  const events = [];

  // Only player inputs and the application's dialogue action change the state.
  // Do not teleport, replace enemies, grant upgrades, or refill resources here.
  function step(input = {}) {
    tick(game, input, 1 / 60);
    events.push(...game.events);
  }

  function until(label, done, input, limit = 60 * 20) {
    let frames = 0;
    while (!done() && frames++ < limit) step(input());
    assert.ok(done(), `${label}: timed out in ${game.scene}`);
  }

  function walkTo(x, {jump = false, run = false} = {}) {
    if (jump) step({jump: true, right: x > game.player.x, left: x < game.player.x, run});
    until(`Reach x=${x}`, () => Math.abs(game.player.x - x) <= 5, () => ({
      right: game.player.x < x, left: game.player.x > x, run,
    }));
    until('Land', () => game.player.ground, () => ({}));
  }

  function defeatBoss(index) {
    until(`Defeat boss ${index + 1}`, () => game.bosses[index].hp === 0, () => {
      const boss = game.bosses[index];
      const distance = boss.x - game.player.x;
      return {
        right: distance > 95 && boss.phase !== 'windup',
        left: distance < 65 || (boss.phase === 'windup' && distance < 120),
        attack: Math.abs(distance) < 130 && game.player.attack <= 0,
        jump: game.player.ground && ['windup', 'charge'].includes(boss.phase),
      };
    });
  }

  function walkRoomTo(x, y) {
    until(`Reach room point ${x},${y}`, () => Math.hypot(game.iso.x - x, game.iso.y - y) < .1, () => {
      const xDistance = x - game.iso.x;
      const yDistance = y - game.iso.y;
      const horizontal = xDistance - yDistance;
      const vertical = xDistance + yDistance;
      return {
        right: horizontal > .07, left: horizontal < -.07,
        down: vertical > .07, up: vertical < -.07,
        attack: game.player.attack <= 0,
      };
    });
  }

  function finishDialogue() {
    let lines = 0;
    while (game.dialogue && lines++ < 20) {
      advanceDialogue(game, stories.es[game.dialogue].length);
    }
    assert.equal(game.dialogue, null);
  }

  // The first two platforms require a walk jump and then a running jump.
  walkTo(250);
  walkTo(365, {jump: true});
  walkTo(450);
  walkTo(665, {jump: true, run: true});
  assert.equal(game.echoes, 2);
  walkTo(745);
  defeatBoss(0);
  walkTo(915);
  walkTo(1000, {jump: true});
  assert.equal(game.echoes, 3);
  walkTo(1110);
  step({interact: true});
  assert.equal(game.scene, 'rehearsal');

  walkRoomTo(-1.8, -1.5);
  step({interact: true});
  assert.equal(game.stage, 1);
  assert.equal(game.dialogue, 'hybrid');
  finishDialogue();
  walkRoomTo(-2.8, 1);
  step({interact: true});
  walkRoomTo(0, 3);
  step({interact: true});
  assert.equal(game.scene, 'wings');

  walkTo(1225);
  step({right: true, dash: true});
  until('Cross the ivy barrier', () => game.gate, () => ({right: true}));
  walkTo(1450);
  defeatBoss(1);
  walkTo(1840);
  step({interact: true});
  assert.equal(game.scene, 'mirror');

  walkRoomTo(2, -3);
  step({interact: true});
  assert.equal(game.stage, 2);
  assert.equal(game.dialogue, 'final');
  finishDialogue();
  walkRoomTo(-2.8, 1);
  step({interact: true});
  walkRoomTo(0, 3);
  step({interact: true});
  assert.equal(game.scene, 'wings');

  walkTo(1950, {jump: true});
  walkTo(2110, {jump: true});
  step({interact: true});
  assert.equal(game.dialogue, 'crossing');
  finishDialogue();

  assert.equal(game.ended, true);
  assert.equal(game.scene, 'theater');
  assert.equal(game.stage, 0);
  assert.deepEqual(game.visited, ['wings', 'threshold', 'rehearsal', 'grove', 'mirror', 'tower', 'theater']);
  assert.ok(game.bosses.every(boss => boss.hp === 0));
  assert.equal(game.echoes, 3);
  assert.equal(game.rests, 2);
  assert.ok(events.some(event => event.type === 'drink'));
  assert.ok(game.damageTaken > 0);
  assert.equal(events.filter(event => event.type === 'respawn').length, 0);
  assert.ok(game.time < 90);
  t.diagnostic(`Journey: ${game.time.toFixed(2)} simulated seconds; ${game.echoes} echoes; ${game.rests} rests; no respawns.`);
});
