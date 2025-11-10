import { RequestHandler } from 'express';
import { getApartment, getApartmentList } from './apartments.service';

/**
 * @description 아파트 목록 조회 핸들러
 * @query 검증된 쿼리 파라미터
 *  - page: 페이지 번호
 *  - limit: 페이지당 항목 수
 *  - name: 아파트 이름으로 필터링(USER 회원가입 시 사용)
 *  - searchKeyword: 아파트 이름, 주소, 관리자 이름, 이메일로 검색 (ADMIN 전체 조회 시 사용)
 *  - apartmentStatus: 관리자 가입 상태로 필터링 (ADMIN 전체 조회 시 사용)
 * @returns 200 OK - 아파트 목록 (USER는 아파트id, 이름, 주소만 반환, ADMIN은 추가 정보 포함)
 */
export const getApartmentListHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;
    const userRole = req.user.role;

    const apartments = await getApartmentList(query, userRole);
    return res.status(200).json(apartments);
  } catch (err) {
    next(err);
  }
};

/**
 * @description 아파트 상세 조회 핸들러
 * @param apartmentId 조회할 아파트 ID
 * @param userRole 요청한 사용자의 역할
 * @returns 200 OK - 아파트 상세 정보 (USER는 아파트id, 이름, 주소만 반환, ADMIN은 추가 정보 포함)
 */
export const getApartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const apartmentId = req.params.id;
    const userRole = req.user.role;

    const apartment = await getApartment(apartmentId, userRole);
    return res.status(200).json(apartment);
  } catch (err) {
    next(err);
  }
};
