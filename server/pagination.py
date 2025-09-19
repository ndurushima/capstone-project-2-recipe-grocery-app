from math import ceil

def paginate(query, req):
    try:
        page = int(req.args.get("page", 1))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = int(req.args.get("per_page", 10))
    except (TypeError, ValueError):
        per_page = 10

    page = max(page, 1)
    per_page = max(1, min(per_page, 100))

    # Fetch results
    items = query.limit(per_page).offset((page - 1) * per_page).all()

    total = query.order_by(None).count()

    data = {
        "items": [i.to_dict() for i in items],
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": ceil(total / per_page) if total else 0,
    }
    return data, 200
