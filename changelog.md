01/23/2026 0.4.4-alpha.12
- fixed issue with npc faceforward issue.
- serialize animation blending value (set with enableBlending())
- serialize avatar ellipsoid and ellipsoid offset
- fixed bug in showEllipsoid wherein calling show true multiple times would result in multiple ellipsoids

07/20/2025 0.4.4-alpha.11
- steps detection issues resolved
- removed lots of dead code related to free fall and going down steep slope
- automated step creation in tesfile

07/20/2025 0.4.4-alpha.10
- optimized pickray (for step and slope detecion) drawing for debug.  
  is turnd on or off by call to showEllipsoid
- steps detection improvement but still buggy
- some test file refactoring
