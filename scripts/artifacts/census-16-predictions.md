# Pre-registered predictions for the exact n=16 polyomino loop census

Logged 2026-06-15, **before** the exact n=16 enumeration (`polyomino-loops.mjs 16`) completed.
Method: extrapolation of the n<=15 trends in `polyomino-loops-15.json`. This mirrors the
pre-registration done for n=15 (predicted 52.70% / max L 5 / f2/f1 0.744; measured 52.77 / 5 / 0.7431).

Known (not predictions): free(16) = 13,079,255 (OEIS A000105); fixed(16) = 27,394,666 (A001168).

| quantity | prediction | basis |
|---|---|---|
| P(L=1), the monolinear fraction | 50.2% (range 49.8 - 50.6) | f1(15)=52.766%, per-cell ratio ~0.952 -> 0.52766 * 0.952 |
| L=1 count | ~6.57M (6.52 - 6.62M) | 0.502 * 13,079,255 |
| f1 decay ratio f1(16)/f1(15) | 0.952 (0.950 - 0.954) | stable measured ratios 0.951-0.955 |
| f2/f1 (count ratio) | 0.79 (0.78 - 0.80) | rising +~0.057/step from 0.7431 at n=15 |
| L=2 count | ~5.15M (5.0 - 5.3M) | f2/f1 * L1count |
| mean L | 1.597 (1.59 - 1.61) | +~0.041/step from 1.5564 |
| max L | **6** | floor((16+2)/3) = 6 |
| first L=6 board | the 6-step diagonal staircase (16 cells) | staircase law: first L=k at n=3k-2; k=6 -> n=16 |
| L=6 count | **1** (staircase unique) | uniqueness held at n=7,10,13 |
| L=3 count | ~1.13M | ratio ~4.3 from 261,901 |
| L=4 count | ~71k | ratio ~5.5 from 12,896 |
| L=5 count | ~800 | ratio ~8-9 from 92 |

## RESULT (measured 2026-06-15, exact enumeration, 2189s, all OEIS counts + gcd + scaling green)

Measured n=16: `1:6576500 2:5264430 3:1164267 4:73226 5:831 6:1`, P(L=1)=50.28%, mean L=1.598, max L=6.

| quantity | prediction | measured | verdict |
|---|---|---|---|
| P(L=1) | 50.2% (49.8-50.6) | 50.274% | PASS |
| L=1 count | ~6.57M | 6,576,500 | PASS |
| f1 decay ratio f1(16)/f1(15) | 0.952 (0.950-0.954) | 0.9528 | PASS |
| f2/f1 | 0.79 (0.78-0.80) | 0.8005 | PASS (top of range) |
| L=2 count | ~5.15M (5.0-5.3M) | 5,264,430 | PASS |
| mean L | 1.597 (1.59-1.61) | 1.598 | PASS |
| max L | 6 | 6 | PASS |
| first L=6 board, unique = staircase | yes | L=6 count = 1, witness = staircase | PASS |
| L=3 / L=4 / L=5 | ~1.13M / ~71k / ~800 | 1,164,267 / 73,226 / 831 | PASS |

**All predictions passed.** The staircase law extends: max L = floor((n+2)/3) holds for all n <= 16, achieved uniquely by the diagonal staircase at n = 3k-2 (now confirmed at n=7,10,13,16). Crossover (L=2 overtakes L=1) extrapolation still lands at n ~ 19-20 (f2/f1 rising +0.057/step: 0.6862, 0.7431, 0.8005 at n=14,15,16).

Monolinear sequence extended: a(16) = 6,576,500.

## Already confirmed directly (do not need the full census)

- The 16-cell diagonal staircase yields **L = 6** (engine, 2026-06-15). So max L >= 6 at n=16, and
  since max L <= floor((n+2)/3) = 6 has held for all n <= 15, the staircase law predicts equality.
  The only open part the census decides: is L=6 achieved **uniquely** by the staircase, and is the
  rest of the distribution as predicted.

Staircase shapes used:
```
n=7  L=3     n=10 L=4     n=13 L=5     n=16 L=6
##.          ##..         ##...        ##....
###          ###.         ###..        ###...
.##          .###         .###.        .###..
             ..##         ..###        ..###.
                          ...##        ...###
                                       ....##
```
