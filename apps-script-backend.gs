/**
 * 전도폭발훈련 조편성 - Google Sheets 백엔드
 *
 * 사용법
 * 1) Google Sheets 새 문서를 만들고, 첫 번째 시트 이름을 "조편성" 으로 바꾼다.
 * 2) 확장 프로그램 > Apps Script 에서 이 코드를 붙여넣는다.
 * 3) 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한이 있는 사용자: 전체(익명 사용자 포함)
 *    로 배포하고, 생성된 웹 앱 URL을 복사한다.
 * 4) team_assignment.html 상단의 SHEET_WEBHOOK_URL 값을 그 URL로 교체한다.
 *
 * 시트 구조 (헤더 1행)
 * 조번호 | 그룹 | 역할 | 코드 | 단계 | 이름
 * 역할 값: leader(조장) / trainer(훈련자) / trainee(훈련생)
 */

const SHEET_NAME = "조편성";
const HEADERS = ["조번호", "그룹", "역할", "코드", "단계", "이름"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

// 조회: 현재 저장된 조편성 전체를 JSON으로 반환
function doGet(e) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return jsonOut_({ ok: true, rows: [] });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const rows = values.map(r => ({
    jo: r[0],
    group: r[1],
    role: r[2],
    code: r[3],
    lvl: String(r[4]),
    name: r[5],
  }));

  return jsonOut_({ ok: true, rows: rows });
}

// 저장: 프론트에서 전체 조편성 배열을 보내면 시트를 통째로 다시 씀
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const rows = body.rows; // [{jo, group, role, code, lvl, name}, ...]

    if (!rows || !Array.isArray(rows)) {
      return jsonOut_({ ok: false, error: "rows 배열이 필요합니다." });
    }

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
    }

    if (rows.length > 0) {
      const values = rows.map(r => [r.jo, r.group, r.role, r.code, r.lvl, r.name]);
      sheet.getRange(2, 1, values.length, HEADERS.length).setValues(values);
    }

    return jsonOut_({ ok: true, saved: rows.length });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
