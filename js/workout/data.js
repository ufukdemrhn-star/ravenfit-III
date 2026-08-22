/* ══════════════════════════════════════════════════════════
   RavenFit — data.js
   Branşa göre egzersiz/program erişimi
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🏋️ ANTRENMAN SİSTEMİ — YENİDEN YAZILDI (v2)
   Katman 1: renderWorkoutHome
   Katman 2A: renderWorkoutTools
   Katman 2B: renderBranchDetail
   Katman 3: renderWorkoutHistory, editWorkoutLog, deleteWorkoutLog
   + Program Seç, Branş Yönetimi, PO Hint
   ══════════════════════════════════════════════════════════ */

/* ── YARDIMCI: Branşa göre egzersiz/program verisini getir ─ */

function _getBranchExercises(branchId){
  if(branchId==='swimming') return EXERCISES_SWIM;
  if(branchId==='posture') return EXERCISES_POST;
  return EXERCISES_DATA;
}

function _getBranchWorkouts(branchId){
  if(branchId==='swimming') return WORKOUTS_SWIM;
  if(branchId==='posture') return WORKOUTS_POST;
  return WORKOUTS_DATA;
}

function _findExercise(exId){
  var ex=null;
  if(EXERCISES_DATA) ex=EXERCISES_DATA.exercises.find(function(e){return e.id===exId;});
  if(!ex&&EXERCISES_SWIM) ex=EXERCISES_SWIM.exercises.find(function(e){return e.id===exId;});
  if(!ex&&EXERCISES_POST) ex=EXERCISES_POST.exercises.find(function(e){return e.id===exId;});
  return ex||{};
}

function _findProgram(progId){
  var prog=null;
  if(WORKOUTS_DATA) prog=WORKOUTS_DATA.workouts.find(function(w){return w.id===progId;});
  if(!prog&&WORKOUTS_SWIM) prog=WORKOUTS_SWIM.workouts.find(function(w){return w.id===progId;});
  if(!prog&&WORKOUTS_POST) prog=WORKOUTS_POST.workouts.find(function(w){return w.id===progId;});
  if(!prog) prog=getCustomWorkouts().find(function(w){return w.id===progId;});
  return prog;
}

function _getBranchForProgram(progId){
  if(WORKOUTS_SWIM&&WORKOUTS_SWIM.workouts.some(function(w){return w.id===progId;})) return 'swimming';
  if(WORKOUTS_POST&&WORKOUTS_POST.workouts.some(function(w){return w.id===progId;})) return 'posture';
  var custom=getCustomWorkouts().find(function(w){return w.id===progId;});
  if(custom&&custom._branch) return custom._branch;
  return 'fitness';
}
