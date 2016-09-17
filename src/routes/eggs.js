export function* quote_suffix(start=0) {
  const pnf_im_me = [
    "is light on it's feet",
    "is quick to the punch",
    "had a heavy breakfast, but a real light lunch",
    "is a raging bonfire",
    "is a cherry bomb",
    "is rough-and-tumble",
    "is the one to beat",
    "is a fresh coat of blacktop burnin' at your feet",
    "is a poisonous sting",
    "pours when it rains",
    "is the best of the best",
    "is the soup du jour",
    "is as smooth as glass",
    "is as sharp as a tack",
    "is the last and best stick of gum in the pack",
    "is a speeding locomotive that just won't stop",
    "is a hot apple pie with a cherry on top",
    "is a cyclone of fun",
    "is an army of one",
    "is the strawberry sprinkles on a hot cross bun",
    "will beat you by a nose at the finish line",
    "is a semi truck trailer with a scent of pine",
    "is the cold hard walls of a prison cell",
    "is a winter trip to the Wisconsin Dells",
    "is a blood-red rose with a string of thorns",
    "is a heart-shaped locket on a cold steel chain",
    "is a big haymaker in a title fight",
    "is a cute black kitten with a nasty bite",
    "is an action double-feature on a Friday night"
  ];
  //noinspection InfiniteLoopJS
  while (true){
    if(start >= pnf_im_me.length){
      start = 0;
    }
    yield pnf_im_me[start];
    start++;
  }
}
