def paginate(query, request, serializer=lambda x: x.to_dict()):
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        page = 1
        per_page = 10
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "page": page,
        "per_page": per_page,
        "total": paginated.total,
        "items": [serializer(item) for item in paginate.items]
    }